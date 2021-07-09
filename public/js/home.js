$(document).ready(function () {
    $.get("/api/posts", { followingOnly: true }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
});