$(document).ready(function () {
    $.get("/api/posts", { followingOnly: true }, (results) => {
        outputPosts(results, $(".postsContainer"));
    })
    $(".logo").css('color', 'var(--blue)');
});

if('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('serviceworker.js')
            .then((reg) => console.log('Success: ', reg.scope))
            .catch((err) => console.log('Failure: ', err));
    })
} 