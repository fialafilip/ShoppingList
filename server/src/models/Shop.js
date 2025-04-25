import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  name: String,
  icon: { type: String, default: '🏪' },
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Family' },
  items: [
    {
      name: String,
      quantity: { type: Number, default: 1 },
      unit: { type: String, default: 'ks' }, // ks, kg, g, l, ml, balení...
      completed: { type: Boolean, default: false },
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      order: { type: Number, default: 0 },
      createdAt: { type: Date, default: Date.now },
      lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      lockedAt: { type: Date },
      lockedByName: { type: String }, // Store the name of the user who locked it for quick access
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Shop', shopSchema);
