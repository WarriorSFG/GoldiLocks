function PromptSizePass(prompt) {
    if(prompt.length <= 1000) {
        return true;
    }
    return false;
}

module.exports = {
    PromptSizePass
}