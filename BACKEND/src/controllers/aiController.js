const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const ChatHistory = require('../models/chatHistoryModel');
const { executeTool } = require('../services/aiToolService');
const dayjs = require('dayjs');
const AiTool = require('../models/aiToolModel');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const getGenerativeModel = async (userRole) => {
    const allowedTools = await AiTool.find({ role: userRole, isEnabled: true }).lean();
    const today = dayjs().format('DD/MM/YYYY');

    const geminiTools = allowedTools.map(tool => {
        let description = tool.description;
        let toolParameters = { type: "OBJECT", properties: {}, required: [] };
        if (tool.parameters && tool.parameters.properties) {
            toolParameters.properties = tool.parameters.properties;
            toolParameters.required = tool.parameters.required || [];
        }
        return {
            functionDeclarations: [{
                name: tool.toolName,
                description: description,
                parameters: toolParameters
            }]
        };
    });

    return genAI.getGenerativeModel({
        model: "gemini-2.5-flash-preview-05-20",
        tools: geminiTools,
        systemInstruction: `Bạn là một trợ lý AI hiệu quả. Bối cảnh: Hôm nay là ngày ${today}.
        QUY TẮC: Nhiệm vụ chính của bạn là gọi các công cụ (tools) được cung cấp.
        1. Nếu người dùng cung cấp ĐẦY ĐỦ tham số (ví dụ: "lịch học ngày mai"), bạn PHẢI tự động gọi công cụ.
        2. Nếu người dùng KHÔNG cung cấp đủ tham số (ví dụ: "lấy lịch học"), bạn PHẢI hỏi lại để lấy thông tin còn thiếu (ví dụ: "Bạn muốn xem lịch ngày nào?").
        3. KHÔNG ĐƯỢC tự ý gọi hàm nếu thiếu tham số bắt buộc.`,
        safetySettings: safetySettings
    });
};

const chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;
        const { chatId } = req.params;
        const accountId = req.user.id;
        const userRole = req.user.role;

        let chatHistory;

        if (chatId) {
            chatHistory = await ChatHistory.findOne({ _id: chatId, accountId });
            if (!chatHistory) return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện." });
        } else {
            chatHistory = new ChatHistory({ accountId, messages: [] });
        }

        const model = await getGenerativeModel(userRole);
        const chat = model.startChat({
            history: chatHistory.messages.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.content }]
            })),
        });

        const result = await chat.sendMessage(message);
        const response = result.response;

        if (!response) {
            console.warn('[AI] Không nhận được response object từ Gemini');
            throw new Error('AI không phản hồi (response null).');
        }

        const promptFeedback = response.promptFeedback || null;
        if (promptFeedback && promptFeedback.blockReason && promptFeedback.blockReason !== 'BLOCK_NONE') {
            const safetyRatings = promptFeedback.safetyRatings || [];
            console.warn('[AI] Prompt bị chặn bởi Safety Filter:', {
                blockReason: promptFeedback.blockReason,
                safetyRatings
            });
            const warnText = `Yêu cầu bị chặn bởi bộ lọc an toàn (${promptFeedback.blockReason}).`;
            chatHistory.messages.push({ role: 'model', content: warnText });
            await chatHistory.save();
            return res.status(200).json({
                reply: warnText,
                chatId: chatHistory._id,
                warn: 'safety-blocked',
                safety: {
                    blockReason: promptFeedback.blockReason,
                    safetyRatings
                }
            });
        }

        const allCandidates = Array.isArray(response.candidates) ? response.candidates : [];
        const nonStopCandidates = allCandidates.filter(c => c?.finishReason && c.finishReason !== 'STOP');
        if (nonStopCandidates.length) {
            console.warn('[AI] Các candidate bị chặn/phát sinh bất thường:', nonStopCandidates.map(c => ({
                finishReason: c.finishReason,
                safetyRatings: c.safetyRatings
            })));
        }

        if (allCandidates.length) {
            // Log nội dung chi tiết để debug khi finishReason=STOP nhưng không có text
            const compact = allCandidates.map((c, idx) => ({
                index: idx,
                finishReason: c.finishReason || null,
                safetyRatings: c.safetyRatings || null,
                hasContent: !!c.content,
                contentParts: c.content?.parts?.map(p => Object.keys(p)) || null
            }));
            console.warn('[AI] Candidate summary:', compact);
        }

        if (allCandidates.length) {
            for (let i = 0; i < allCandidates.length; i++) {
                const cand = allCandidates[i];
                console.debug(`[AI] Candidate[${i}] raw:`, JSON.stringify(cand, null, 2));
            }
        }

        chatHistory.messages.push({ role: 'user', content: message });

        const normalizeFunctionCalls = (resp) => {
            const calls = Array.isArray(resp.functionCalls) ? resp.functionCalls.slice() : [];
            if (calls.length > 0) return calls;
            const candidates = Array.isArray(resp.candidates) ? resp.candidates : [];
            candidates.forEach(candidate => {
                const parts = candidate?.content?.parts || [];
                parts.forEach(part => {
                    if (part.functionCall) {
                        const args = part.functionCall.args;
                        let normalizedArgs = args;
                        if (typeof args === 'string') {
                            try {
                                normalizedArgs = JSON.parse(args);
                            } catch (err) {
                                console.warn('[AI] Không parse được functionCall.args string, giữ nguyên dạng chuỗi.', { name: part.functionCall.name, args });
                            }
                        }
                        calls.push({
                            name: part.functionCall.name,
                            args: normalizedArgs || {}
                        });
                    }
                });
            });
            return calls;
        };

        const functionCalls = normalizeFunctionCalls(response);

        const normalizeFunctionResponsePayload = (toolResult) => {
            if (toolResult === null || typeof toolResult === 'undefined') {
                return {};
            }
            if (typeof toolResult === 'string') {
                try {
                    return JSON.parse(toolResult);
                } catch (err) {
                    console.warn('[AI] Tool trả về chuỗi không phải JSON, bọc vào { result }.');
                    return { result: toolResult };
                }
            }
            if (typeof toolResult === 'object') {
                return toolResult;
            }
            return { result: toolResult };
        };

        if (functionCalls.length > 0) {
            const call = functionCalls[0];

            console.log(`[DEBUG] AI yêu cầu gọi hàm: ${call.name}`);
            console.log(`[DEBUG] Với tham số: ${JSON.stringify(call.args)}`);

            const toolResult = await executeTool(call.name, call.args, accountId);

            console.log(`[DEBUG] Kết quả từ tool: ${JSON.stringify(toolResult)}`);
            const functionResponsePayload = normalizeFunctionResponsePayload(toolResult);

            console.log('[DEBUG] Gửi lại kết quả tool cho model (structured)');
            const result2 = await chat.sendMessage([{ functionResponse: { name: call.name, response: functionResponsePayload } }]);

            console.log('[DEBUG] result2:', { hasResponse: !!result2.response, responseText: result2.response ? result2.response.text() : null });

            if (!result2.response || !result2.response.text()) {
                console.warn('AI không phản hồi sau khi nhận kết quả tool. Trả về kết quả raw của tool cho user.');
                const fallbackText = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
                chatHistory.messages.push({ role: 'model', content: fallbackText });
                await chatHistory.save();
                return res.status(200).json({ reply: fallbackText, chatId: chatHistory._id, warn: 'AI không sinh câu trả lời tự nhiên; trả về dữ liệu tool thô.' });
            }

            const finalResponse = result2.response.text();
            chatHistory.messages.push({ role: 'model', content: finalResponse });
            await chatHistory.save();
            return res.status(200).json({ reply: finalResponse, chatId: chatHistory._id });
        } else if (response.text()) {
            const replyText = response.text();
            chatHistory.messages.push({ role: 'model', content: replyText });
            await chatHistory.save();
            return res.status(200).json({ reply: replyText, chatId: chatHistory._id });
        }

        const candidateInfo = Array.isArray(response.candidates) ? response.candidates.map((c, idx) => ({
            index: idx,
            finishReason: c.finishReason || null,
            safetyRatings: c.safetyRatings || null,
            hasContent: !!c.content,
            contentParts: c.content?.parts || null
        })) : [];
        console.warn('[AI] Không có phản hồi text/call từ model. candidate info:', candidateInfo);

        // (Đây là dòng 118 của bạn)
        throw new Error("AI không phản hồi. (Có thể do Safety Filter)");
    } catch (error) {
        console.error("Lỗi AI Chat:", error);
        res.status(500).json({ message: 'Lỗi server khi giao tiếp với AI.' });
    }
};

const getChatHistoryList = async (req, res) => {
    try {
        const accountId = req.user.id;
        const histories = await ChatHistory.find({ accountId })
            .select('messages createdAt updatedAt')
            .sort({ updatedAt: -1 })
            .limit(20);
        const historyList = histories.map(h => ({
            _id: h._id,
            title: h.messages[0] ? h.messages[0].content.substring(0, 40) + '...' : 'Cuộc trò chuyện mới',
            updatedAt: h.updatedAt
        }));
        res.status(200).json({ success: true, data: historyList });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getChatHistoryById = async (req, res) => {
    try {
        const { chatId } = req.params;
        const accountId = req.user.id;
        const chatHistory = await ChatHistory.findOne({ _id: chatId, accountId });
        if (!chatHistory) {
            return res.status(404).json({ message: "Không tìm thấy cuộc trò chuyện." });
        }
        res.status(200).json({ success: true, data: chatHistory.messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

const getNewChat = async (req, res) => {
    try {
        const initialMessage = {
            role: 'model',
            content: 'Chào bạn, tôi là trợ lý AI của UAP. Bạn cần giúp gì?'
        };
        res.status(200).json({ success: true, data: [initialMessage] });
    } catch (error) {
        console.error("Lỗi khi tạo chat mới:", error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};

module.exports = {
    chatWithAI,
    getChatHistoryList,
    getChatHistoryById,
    getNewChat
};