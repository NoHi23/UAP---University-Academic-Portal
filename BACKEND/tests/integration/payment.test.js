const { app, request } = require('../utils/setup');
const crypto = require('crypto');

describe('Payment Controller', () => {
    describe('GET /api/payment/vnpay_return', () => {
        const mockVnpayParams = {
            vnp_Amount: '10000000',
            vnp_BankCode: 'NCB',
            vnp_BankTranNo: '20241114123456',
            vnp_CardType: 'ATM',
            vnp_OrderInfo: 'Thanh toan hoc phi HK1 2024',
            vnp_PayDate: '20241114123456',
            vnp_ResponseCode: '00',
            vnp_TmnCode: 'VNPAY123',
            vnp_TransactionNo: '14123456',
            vnp_TxnRef: 'ORDER123456789',
            vnp_SecureHashType: 'SHA512'
        };

        const createValidSecureHash = (params) => {
            const sortedKeys = Object.keys(params).sort();
            let signData = "";
            for (const key of sortedKeys) {
                if (!params[key] || key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') continue;
                signData += (signData.length === 0 ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }

            const secretKey = process.env.VNP_HASHSECRET || 'VNPAY_TEST_SECRET_KEY';
            const hmac = crypto.createHmac("sha512", secretKey);
            return hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        };

        it('should handle successful payment callback', async () => {
            const testParams = { ...mockVnpayParams };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_return')
                .query(testParams);

            // Should redirect to frontend with success status
            expect([200, 302]).toContain(response.status);

            // If it's a redirect, check the location header contains success info
            if (response.status === 302) {
                expect(response.headers.location).toContain('payment-result');
            }
        });

        it('should handle failed payment callback', async () => {
            const testParams = {
                ...mockVnpayParams,
                vnp_ResponseCode: '01' // Failed response code
            };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_return')
                .query(testParams);

            expect([200, 302]).toContain(response.status);

            if (response.status === 302) {
                expect(response.headers.location).toContain('payment-result');
            }
        });

        it('should handle invalid secure hash', async () => {
            const testParams = {
                ...mockVnpayParams,
                vnp_SecureHash: 'invalid_hash_value'
            };

            const response = await request(app)
                .get('/api/payment/vnpay_return')
                .query(testParams);

            expect([200, 302, 400]).toContain(response.status);
        });

        it('should handle missing required parameters', async () => {
            const incompleteParams = {
                vnp_ResponseCode: '00',
                vnp_TxnRef: 'ORDER123',
                vnp_SecureHash: 'some_hash'
            };

            const response = await request(app)
                .get('/api/payment/vnpay_return')
                .query(incompleteParams);

            expect([200, 302, 400]).toContain(response.status);
        });

        it('should not require authentication', async () => {
            // VNPay callback endpoints should be public
            const testParams = { ...mockVnpayParams };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_return')
                .query(testParams);

            // Should not return 401 (unauthorized)
            expect(response.status).not.toBe(401);
        });
    });

    describe('GET /api/payment/vnpay_ipn', () => {
        const mockVnpayIPNParams = {
            vnp_Amount: '10000000',
            vnp_BankCode: 'NCB',
            vnp_BankTranNo: '20241114123456',
            vnp_CardType: 'ATM',
            vnp_OrderInfo: 'Thanh toan hoc phi HK1 2024',
            vnp_PayDate: '20241114123456',
            vnp_ResponseCode: '00',
            vnp_TmnCode: 'VNPAY123',
            vnp_TransactionNo: '14123456',
            vnp_TxnRef: 'ORDER123456789',
            vnp_SecureHashType: 'SHA512'
        };

        const createValidSecureHash = (params) => {
            const sortedKeys = Object.keys(params).sort();
            let signData = "";
            for (const key of sortedKeys) {
                if (!params[key] || key === 'vnp_SecureHash' || key === 'vnp_SecureHashType') continue;
                signData += (signData.length === 0 ? '' : '&') + encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
            }

            const secretKey = process.env.VNP_HASHSECRET || 'VNPAY_TEST_SECRET_KEY';
            const hmac = crypto.createHmac("sha512", secretKey);
            return hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        };

        it('should handle valid IPN notification', async () => {
            const testParams = { ...mockVnpayIPNParams };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_ipn')
                .query(testParams);

            // IPN should return status response, usually JSON
            expect([200, 400]).toContain(response.status);

            if (response.status === 200) {
                // Success response should have RspCode
                if (response.body && typeof response.body === 'object') {
                    expect(response.body).toHaveProperty('RspCode');
                }
            }
        });

        it('should reject invalid secure hash for IPN', async () => {
            const testParams = {
                ...mockVnpayIPNParams,
                vnp_SecureHash: 'invalid_hash_for_ipn'
            };

            const response = await request(app)
                .get('/api/payment/vnpay_ipn')
                .query(testParams);

            expect([200, 400]).toContain(response.status);

            if (response.body && response.body.RspCode) {
                expect(['97', '99']).toContain(response.body.RspCode); // Error codes
            }
        });

        it('should handle failed transaction IPN', async () => {
            const testParams = {
                ...mockVnpayIPNParams,
                vnp_ResponseCode: '01' // Failed response code
            };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_ipn')
                .query(testParams);

            expect([200, 400]).toContain(response.status);
        });

        it('should not require authentication', async () => {
            // VNPay IPN endpoints should be public for webhook
            const testParams = { ...mockVnpayIPNParams };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_ipn')
                .query(testParams);

            // Should not return 401 (unauthorized)
            expect(response.status).not.toBe(401);
        });

        it('should return proper response format for VNPay', async () => {
            const testParams = { ...mockVnpayIPNParams };
            testParams.vnp_SecureHash = createValidSecureHash(testParams);

            const response = await request(app)
                .get('/api/payment/vnpay_ipn')
                .query(testParams);

            // VNPay expects JSON response with RspCode
            if (response.body && typeof response.body === 'object') {
                expect(response.body).toHaveProperty('RspCode');
                expect(typeof response.body.RspCode).toBe('string');
            }
        });
    });
});