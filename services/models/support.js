import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
    message: { type: String, required: true },
    reply: { type: String, required: true },
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Message = model('Message', messageSchema);

export default Message;
