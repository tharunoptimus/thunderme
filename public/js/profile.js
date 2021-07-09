$(document).ready(function () {
    if(selectedTab === "replies") { 
        loadReplies(); 
    }
    else { 
        loadPosts();
    }
});

function loadPosts() {

    $.get("/api/posts", { postedBy: profileUserId, pinned: true }, (results) => {
        outputPinnedPosts(results, $(".pinnedPostContainer"));
    })
    
    $.get("/api/posts", { postedBy: profileUserId, isReply: false }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
}
function loadReplies() {
    $.get("/api/posts", { postedBy: profileUserId, isReply: true }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
}

const outputPinnedPosts = (results, container) => {

    if(results.length == 0) {
        container.hide();
        return
    }

	container.html("");

	results.forEach((result) => {
		var html = createPostHtml(result);
		container.append(html);
	});
};
