const mongoose = require('mongoose');
const { Schema } = mongoose;


const cloSchema = new Schema({
  cloName: {
    type: Number,
    required: true
  },
  cloDetails: {
    type: String,
    required: true,
    trim: true,
  },
  loDetails: {
    type: String,
    trim: true
  },
  subjectId: {
    type: Schema.Types.ObjectId,
    ref: 'Subject', 
    required: true
  }
}, {
  timestamps: true
});

// Unique cloName per subjectId
cloSchema.index({ subjectId: 1, cloName: 1 }, { unique: true });
cloSchema.index({ subjectId: 1, cloDetails: 1 }, { unique: true });


module.exports = mongoose.model("CLO", cloSchema);