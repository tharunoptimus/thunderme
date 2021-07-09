$(document).ready(function () {
    if(selectedTab === "followers") { loadFollowers(); }
    else { loadFollowing();}
});

function loadFollowers() {
    $.get(`/api/users/${profileUserId}/followers`,  (results) => {
        outputUser(results.followers, $(".resultsContainer"));
    })
}

function loadFollowing() {
    $.get(`/api/users/${profileUserId}/following`,  (results) => {
        outputUser(results.following, $(".resultsContainer"));
    })
}