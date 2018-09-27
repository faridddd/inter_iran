const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const PostSchema = new Schema({
    title: {
        required: true,
        type: String
    },
    image: {
        type: String
    },
    matn: {
        required: true,
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    },
    comments: [{
        commentBody: {
            type: String,
            required: true
        },
        commentDate: {
            type: Date,
            default: Date.now
        },
        commentUser: {
            type: String
        }

    }]
})
const Post = mongoose.model('posts', PostSchema);

module.exports = Post;