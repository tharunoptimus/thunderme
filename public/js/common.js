// Global Variables
var cropper;
var timer;
var selectedUsers = [];
var isMobileView;
var uploadedImageLink;
if(inChatPage === undefined) { var inChatPage = false; }
if(inNewChatPage === undefined) { var inNewChatPage = false; }

$(document).ready(function () {
	refreshMessagesBadge();
	refreshNotificationsBadge();
	if (screen.width < 992) { $(".hideOnSmallDisplay").hide(); }
    else { $(".hideOnSmallDisplay").show(); }

	if(screen.width < 420) {
		$("#navigatorBarDesktop").remove();
		isMobileView = true;
		$(".row").css("flex-direction", "column");
		if(inChatPage) {
			$(".mainSectionContainer").css("position", "relative");
		}
		if(inNewChatPage) {
			$(".mainSectionContainer").css("position", "relative");
		}
	}
	else {
		$("#navigatorBarMobile").remove();
		isMobileView = false;
	}
	if(window.location.hostname !== 'localhost') {
		if (location.protocol !== 'https:') {
			location.replace(`https:${location.href.substring(location.protocol.length)}`);
		}
	}
});

function toggleUploadButtons () {
	$("#uploadImage").show();
	$("#toBeUploaded").remove();
	$("#cancelImage").hide();
	uploadedImageLink = null;
	return true;
}

$("#postTextarea, #replyTextarea").keyup(function (e) {
	var textbox = $(e.target);
	var value = textbox.val().trim();

	var isModal = textbox.parents(".modal").length == 1;

	var submitButton = isModal
		? $("#submitReplyButton")
		: $("#submitPostButton");

	if (submitButton.length == 0) {
		return alert("No submit button found");
	}

	if (value == "") {
		submitButton.prop("disabled", true);
		return;
	}

	submitButton.prop("disabled", false);
});

$("#submitPostButton, #submitReplyButton").click((event) => {
	// Create separate jquery functions for handling for summernote
	var button = $(event.target);

	var isModal = button.parents(".modal").length == 1;

	var textbox = isModal ? $("#replyTextarea") : $("#postTextarea");
	var data = {
		content: textbox.val(),
	};

	data.imagePath = isModal ? undefined : uploadedImageLink;

	if (isModal) {
		var id = button.data().id;
		if (id == null) return alert("Button id is Null");
		data.replyTo = id;
	}

	$.post("/api/posts", data, (postData, status, xhr) => {
		if (postData.replyTo) {
			emitNotification(postData.replyTo.postedBy);
			location.reload();
		} else {
			var html = createPostHtml(postData);
			$(".postsContainer").prepend(html);
			textbox.val("");
			button.prop("disabled", true);
		}
	});
	var isComplete = isModal ? null : toggleUploadButtons();
});

$("#replyModal").on("show.bs.modal", (event) => {
	var button = $(event.relatedTarget);
	var postId = getPostIdFromElement(button);

	$("#submitReplyButton").data("id", postId);

	$.get("/api/posts/" + postId, (results) => {
		outputPosts(results.postData, $("#originalPostContainer"));
	});
});

$("#replyModal").on("hidden.bs.modal", () =>
	$("#originalPostContainer").html("")
);

$("#deletePostModal").on("show.bs.modal", (event) => {
	var button = $(event.relatedTarget);
	var postId = getPostIdFromElement(button);

	$("#deletePostButton").data("id", postId);
	
});

$("#confirmPinModal").on("show.bs.modal", (event) => {
	var button = $(event.relatedTarget);
	var postId = getPostIdFromElement(button);

	$("#pinPostButton").data("id", postId);
	
});

$("#unpinModal").on("show.bs.modal", (event) => {
	var button = $(event.relatedTarget);
	var postId = getPostIdFromElement(button);

	$("#unpinPostButton").data("id", postId);
	
});

$("#userSearchTextbox").keydown(function (e) { 
    clearTimeout(timer);
    var textbox = $(e.target);
    var value = textbox.val();

	if(value == "" && (e.which == 8 || e.keyCode == 8)) {
		// Remove user from selection
		selectedUsers.pop();
		updateSelectedUsersHtml();
		$(".resultsContainer").html("");

		if(selectedUsers.length == 0) {
			$("#createChatButton").prop("disabled", true)
		}
		return;
	}

    timer = setTimeout(() => {
        value = textbox.val().trim();

        if(value == "") {
            $(".resultsContainer").html("");
        }
        else {
            searchUsers(value);
        }
    }, 1000)
    
});

$("#createChatButton").click((event) => {
	var data = JSON.stringify(selectedUsers);

	$.post("/api/chats", { users: data }, chat => {

		if(!chat || !chat._id) return alert("Could not create the Chat now. Try again!")

		window.location.href=`/messages/${chat._id}`;
	})

})


$("#deletePostButton").click((event) => {
	var postId = $(event.target).data("id");

	$.ajax({
		url: `/api/posts/${postId}`,
		type: "DELETE",
		success: (data, status, xhr) => {

			if(xhr.status != 202) {
				alert("Could not Delete your Post!")
				return;
			}
			location.reload();
		},
	});

})

$("#pinPostButton").click((event) => {
	var postId = $(event.target).data("id");

	$.ajax({
		url: `/api/posts/${postId}`,
		type: "PUT",
		data: { pinned: true },
		success: (data, status, xhr) => {

			if(xhr.status != 204) {
				alert("Could not pin the post!")
				return;
			}
			location.reload();
		},
	});

})

$("#unpinPostButton").click((event) => {
	var postId = $(event.target).data("id");

	$.ajax({
		url: `/api/posts/${postId}`,
		type: "PUT",
		data: { pinned: false },
		success: (data, status, xhr) => {

			if(xhr.status != 204) {
				alert("Could not pin the post!")
				return;
			}
			location.reload();
		},
	});

})

$("#filePhoto").change(function() {
	
	if(this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById("imagePreview");
			image.src = e.target.result;

			if(cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				aspectRatio: 1 / 1,
				background: false
			});

		}
		reader.readAsDataURL(this.files[0]);
	}
})

$("#coverPhoto").change(function() {
	
	if(this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById("coverPreview");
			image.src = e.target.result;

			if(cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				aspectRatio: 4 / 1,
				background: false
			});

		}
		reader.readAsDataURL(this.files[0]);
	}
})

$(document).on("click", "#uploadImage", (event) => {
	$('#createPostImageUploadModal').modal('show');
})

$("#filePostPhoto").change(function() {
	
	if(this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById("imagePreview");
			image.src = e.target.result;

			if(cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				background: false
			});

		}
		reader.readAsDataURL(this.files[0]);
	}
})

$("#sendImageInput").change(function() {

	if(this.files && this.files[0]) {
		var reader = new FileReader();
		reader.onload = (e) => {
			var image = document.getElementById("imagePreview");
			image.src = e.target.result;

			if(cropper !== undefined) {
				cropper.destroy();
			}

			cropper = new Cropper(image, {
				background: false
			});

		}
		reader.readAsDataURL(this.files[0]);
	}
})

$("#imageUploadButton").click(()=> {
	var canvas = cropper.getCroppedCanvas();

	if(canvas == null) {
		return alert("Could not upload the image. Make sure it is an image file.");
	}

	canvas.toBlob((blob) => {
		var formData = new FormData();
		formData.append("croppedImage", blob);

		$.ajax({
			url: "/api/users/profilePicture",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: () => location.reload()
		})
	})
})

$("#coverPhotoButton").click(()=> {
	var canvas = cropper.getCroppedCanvas();

	if(canvas == null) {
		return alert("Could not upload the image. Make sure it is an image file.");
	}

	canvas.toBlob((blob) => {
		var formData = new FormData();
		formData.append("croppedImage", blob);

		$.ajax({
			url: "/api/users/coverPhoto",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: () => location.reload()
		})
	})
})

$("#postImageUploadButton").click(()=> {
	var canvas = cropper.getCroppedCanvas();
	var width = canvas.width;

	if(canvas == null) {
		return alert("Could not upload the image. Make sure it is an image file.");
	}

	let image = new Image();
	image.src = canvas.toDataURL();
	image.id = "toBeUploaded";

	$(".postImageContainer").append(image);
	canvas.toBlob((blob) => {
		var formData = new FormData();
		formData.append("croppedImage", blob);

		$.ajax({
			url: "/api/users/uploadImage",
			type: "POST",
			data: formData,
			processData: false,
			contentType: false,
			success: (uploadedImageURL, status, xhr) => {
				if(xhr.status == 201) {
					uploadedImageLink = uploadedImageURL;
				}
				else {
					alert("Unable to Upload the Image selected. Please try again!");
					return;
				}
			}
		})
	})
	$("#uploadImage").hide();
	$("#cancelImage").show();
	$('#createPostImageUploadModal').modal('toggle');
	alert("Please wait for 15-20 secs before posting a new tweet!")
	
})

$("#cancelImage").click(()=> {
	var done = toggleUploadButtons();
})

$("#confirmSendImageButton").click(()=> {
	var canvas = cropper.getCroppedCanvas();

	if(canvas == null) {
		return alert("Could not upload the image. Make sure it is an image file.");
	}

	canvas.toBlob((blob) => {
		var formData = new FormData();
		formData.append("croppedImage", blob);
		uploadCroppedImage(formData);
	})
})

$(document).on("click", ".likeButton", (event) => {
	var button = $(event.target);
	var postId = getPostIdFromElement(button);
	if (postId === undefined) return;

	$.ajax({
		url: `/api/posts/${postId}/like`,
		type: "PUT",
		success: (postData) => {
			button.find("span").text(postData.likes.length || "");

			if (postData.likes.includes(userLoggedIn._id)) {
				button.addClass("active");
				emitNotification(postData.postedBy);
			} else {
				button.removeClass("active");
			}
		},
	});
});

$(document).on("click", ".retweetButton", (event) => {
	var button = $(event.target);
	var postId = getPostIdFromElement(button);
	if (postId === undefined) return;

	$.ajax({
		url: `/api/posts/${postId}/retweet`,
		type: "POST",
		success: (postData) => {
			button.find("span").text(postData.retweetUsers.length || "");

			if (postData.retweetUsers.includes(userLoggedIn._id)) {
				button.addClass("active");
				emitNotification(postData.postedBy);
			} else {
				button.removeClass("active");
			}
		},
	});
});

$(document).on("click", ".shareButton", async (event) => {
	var element = $(event.target);
	var postId = getPostIdFromElement(element);

	if(postId !== undefined) {
		var shareData = {
			title: "Thunder Me",
			text: "Tweet on ThunderMe",
			url: window.location.origin + "/posts/" + postId,
		};
		try {
			await navigator.share(shareData);
		} catch (err) {
			console.log(err);
			alert("Unable to share!")
		}

	}
});

$(document).on("click", ".post", (event) => {
	var element = $(event.target);
	var postId = getPostIdFromElement(element);

	if(postId !== undefined && !element.is("button") && !element.is("a")) {
		window.location.href = '/posts/' + postId;
	}
});

$(document).on("click", ".followButton", (e) => {
	var button = $(e.target);
	var userId = button.data().user;

	$.ajax({
		url: `/api/users/${userId}/follow`,
		type: "PUT",
		success: (data, status, xhr) => {

			if(xhr.status == 404) {
				alert("Unable to Follow. Try Again");
				return;
			}

			if (data.following && data.following.includes(userId)) {
				button.addClass("following");
				button.text("Following");
				var difference = 1;
				emitNotification(userId);
			} else {
				button.removeClass("following");
				button.text("Follow");
				var difference = -1;
			}

			var followersLabel = $("#follwersValue");
			if(followersLabel.length != 0) {
				var followersText = followersLabel.text();
				followersText = parseInt(followersText)
				followersLabel.text(followersText + difference)
			}
		},
	});
	
});

$(document).on("click", ".notification.active", (e) => {
	var container = $(e.target);
	var notificationId = container.data().id;

	var href = container.attr("href");
	e.preventDefault();

	var callback = () => window.location = href;
	markNotificationsAsOpened(notificationId, callback);
	
});


const getPostIdFromElement = (element) => {
	var isRoot = element.hasClass("post");
	var rootElement = isRoot == true ? element : element.closest(".post");
	var postId = rootElement.data().id;

	if (postId == undefined) return alert("Post id undefined");

	return postId;
};

function replaceURLs(message) {
	if (!message) return;

	var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
	return message.replace(urlRegex, function (url) {
		var hyperlink = url;
		if (!hyperlink.match("^https?://")) {
			hyperlink = "http://" + hyperlink;
		}
		return (
			'<a class=\'postLink\' href="' +
			hyperlink +
			'" target="_blank" rel="noopener noreferrer">' +
			url +
			" <i class='far fa-external-link-square-alt urlLink'></i> </a>"
		);
	});
}

const createPostHtml = (postData, largeFont = false) => {
	if (postData == null) return alert("Post Object is Null!");

	if (postData.content == null) {
		postData.content =
			"<div class='notAvailable'>This content is not available</div>";
	}

	var image = "";

	if(postData.imagePath != "" && postData.imagePath != null) {
		image = `<div class='postImageHolder'>
					<div class='realPostImageHolder'>
						<a href="${postData.imagePath}"><img style='width: 100%' src="${postData.imagePath}" class="postImage" alt=${postData.content} /></a>
					</div>
				</div>`;
	}

	var isRetweet = postData.retweetData !== undefined;
	var retweetedBy = isRetweet ? postData.postedBy.username : null;
	postData = isRetweet ? postData.retweetData : postData;

	var postedBy = postData.postedBy;

	if (postedBy._id === undefined) {
		return console.log("User data was not populated");
	}

	var displayName = isMobileView ? postedBy.firstName : postedBy.firstName + " " + postedBy.lastName;
	var timestamp = timeDifference(new Date(), new Date(postData.createdAt));

	var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id)
		? "active"
		: "";
	var retweetButtonActiveClass = postData.retweetUsers.includes(
		userLoggedIn._id
	)
		? "active"
		: "";

	var largeFontClass = largeFont ? "largeFont" : "";

	var retweetText = "";

	if (isRetweet) {
		retweetText = `<span>
							<i class="fal fa-retweet"></i>
							Reposted by <a href='/profile/${retweetedBy}'>@${retweetedBy}</a>
						</span>`;
	}

	var replyFlag = "";
	if (postData.replyTo && postData.replyTo._id) {
		if (!postData.replyTo._id) {
			return alert("Reply to is not populated");
		} else if (!postData.replyTo.postedBy._id) {
			return alert("Posted By is not populated");
		}

		var replyToUsername = postData.replyTo.postedBy.username;
		replyFlag = `<div class ='replyFlag'>
						Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
					</div>`;
	}

	var buttons = "";
	var pinnedPostText = "";
	if(postData.postedBy._id == userLoggedIn._id) {

		var dataTarget = '#confirmPinModal';
		if(postData.pinned === true) {
			pinnedPostText = `<i class='fal fa-thumbtack'></i> <span>Pinned by ${postedBy.username}<span>`;
			dataTarget = "#unpinModal";
			buttons = `	<button style='outline: none;' data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}"><i style="color: var(--blue);" class="fas fa-thumbtack"></i></button>
					<button class='deleteButton' style='outline: none;' data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fal fa-trash-alt"></i></button>`;
		}
		else {
			buttons = `	<button class='pinButton' style='outline: none;' data-id="${postData._id}" data-toggle="modal" data-target="#confirmPinModal" aria-label="Pin Post"><i class="fal fa-thumbtack"></i></button>
					<button class='deleteButton' style='outline: none;' data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal" aria-label="Delete Post"><i class="fal fa-trash-alt"></i></button>`;
		}	
	}

	if(postData.postedBy._id != userLoggedIn._id && postData.pinned === true) {
		pinnedPostText = `<i class='fal fa-thumbtack'></i> <span>Pinned by ${postedBy.username}<span>`;
	}


	return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
				<div class='postActionContainer'>
					${retweetText}
				</div>
                <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src = '${postedBy.profilePic}' alt='User Profile Photo'>
                    </div>
                    <div class='postContentContainer'>
						<div class='pinnedPostText'>
							${pinnedPostText}
						</div>
                        <div class='header'>
							<div class='postedByNameHolder'>
								<a href='/profile/${
									postedBy.username
								}'>${displayName}</a>
							</div>
                            <span class='username'>@${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
							${buttons}
                        </div>
						${replyFlag}
                        <div class='postBody'>
							<span>${replaceURLs(postData.content)}</span>
							${image}
                        </div>
                        <div class='postFooter'>
                            <div class='postButtonContainer'>
                                <button aria-label='comment'  style='outline: none;' data-toggle='modal' data-target='#replyModal'>
                                    <i class="fal fa-comment"></i>
                                </button>
                            </div>

                            <div class='postButtonContainer green'>
                                <button aria-label='retweet'  style='outline: none;' class='retweetButton ${retweetButtonActiveClass}'>
                                    <i class="fal fa-retweet"></i>
									<span>${postData.retweetUsers.length || ""}</span>
                                </button>
                            </div>

                            <div class='postButtonContainer red'>
                                <button aria-label='like'  style='outline: none;' class='likeButton ${likeButtonActiveClass}'>
                                    <i class="fal fa-heart"></i>
									<span>${postData.likes.length || ""}</span>
                                </button>
                            </div>

							<div class='postButtonContainer'>
                                <button aria-label='like' style='outline: none;' class='shareButton'>
								<i class="fal fa-share-alt"> </i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
};

function timeDifference(current, previous) {
	var msPerMinute = 60 * 1000;
	var msPerHour = msPerMinute * 60;
	var msPerDay = msPerHour * 24;
	var msPerMonth = msPerDay * 30;
	var msPerYear = msPerDay * 365;

	var elapsed = current - previous;

	if (elapsed < msPerMinute) {
		if (elapsed / 1000 < 30) return "Just now";
		return Math.round(elapsed / 1000) + "s";
	} else if (elapsed < msPerHour) {
		return Math.round(elapsed / msPerMinute) + "m";
	} else if (elapsed < msPerDay) {
		return Math.round(elapsed / msPerHour) + "h";
	} else if (elapsed < msPerMonth) {
		return Math.round(elapsed / msPerDay) + "d";
	} else if (elapsed < msPerYear) {
		return Math.round(elapsed / msPerMonth) + "month";
	} else {
		return Math.round(elapsed / msPerYear) + "y";
	}
}

const outputPosts = (results, container) => {
	container.html("");

	if (!Array.isArray(results)) {
		results = [results];
	}

	results.forEach((result) => {
		var html = createPostHtml(result);
		container.append(html);
	});

	if (results.length == 0) {
		container.append("<span class='noResults'>Nothing to show.</span>");
	}
};

const outputPostsWithReplies = (results, container) => {
	container.html("");

	if(results.replyTo !== undefined && results.replyTo._id !== undefined)  {
		var html = createPostHtml(results.replyTo);
		container.append(html);
	}

	var mainpostHtml = createPostHtml(results.postData, true);
	container.append(mainpostHtml);

	results.replies.forEach((result) => {
		var html = createPostHtml(result);
		container.append(html);
	});
};

function outputUser(results, container) {
    container.html("");

    if(results.length == 0){
        container.append("<span class='noResults'>No Results Found</span>");
        return;
    }

    results.forEach(result => {
        var html = createUserHtml(result, true);
        container.append(html);
    })
}

function createUserHtml(userData, showFollowButton) {

    var name = userData.firstName + " " + userData.lastName;
    var isFollowing = userLoggedIn.following && userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow"
    var buttonClass = isFollowing ? "followButton following" : "followButton"

    var followButton = "";

    if(showFollowButton && userLoggedIn._id != userData._id) {
        followButton = `<div class='followButtonContainer'>
                            <button style='outline: none;' class='${buttonClass}' data-user='${userData._id}'>${text}</button>
                        </div>`
    }

    return `<div class='user'>
                <div class='userImageContainer'>
                    <img src='${userData.profilePic}' alt='Profile Photo'>
                </div>
                <div class ='userDetailsContainer'>
                    <div class-'header'>
                        <a href='/profile/${userData.username}'>${name}</a>
                        <span class='username'>@${userData.username}</span>
                    </div>
                </div>
                ${followButton}
            </div>`;
}

function searchUsers(searchTerm) {
    $.get("/api/users", { search: searchTerm }, results => {
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container) {
    container.html("");

    results.forEach(result => {
        
        if(result._id == userLoggedIn._id || selectedUsers.some(u => u._id == result._id)) {
            return;
        }

        var html = createUserHtml(result, false);
        var element = $(html);
        element.click(() => userSelected(result))

        container.append(element);
    });

    if(results.length == 0) {
        container.append("<span class='noResults'>No results found</span>")
    }
}

function userSelected(user) {
    selectedUsers.push(user);
	updateSelectedUsersHtml();
    $("#userSearchTextbox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled", false);
}

function updateSelectedUsersHtml () {
	var elements = [];

	selectedUsers.forEach(user => {
		var name = user.firstName + " " + user.lastName;
		var userElement = $(`<span class='selectedUser'>${name}</span>`);
		elements.push(userElement);
	})

	$(".selectedUser").remove();
	$("#selectedUsers").prepend(elements);
}

function getChatName(chatData) {
    var chatName = chatData.chatName;
    if(!chatName) {
        var otherChatUsers = getOtherChatUsers(chatData.users);
        var namesArray = otherChatUsers.map(user=> user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ")
    }

    return chatName;
}

function getOtherChatUsers(users) {
    if(users.length == 1) return users;
    return users.filter(user => user._id != userLoggedIn._id )
}

function messageReceived(newMessage) {
	if($(`[data-room="${newMessage.chat._id}"]`).length == 0) {
		// Show popup notification
		showMessagePopup(newMessage);
	}
	else {
		addChatMessageHtml(newMessage);
	}
	refreshMessagesBadge();
}

function markNotificationsAsOpened(notificationId = null, callback = null) {
	if(callback == null) callback =() => location.reload();

	var url = notificationId != null ? `/api/notifications/${notificationId}/markAsOpened`: `/api/notifications/markAsOpened`;

	$.ajax({
		url: url,
		type: "PUT",
		success: () => callback()
	})
}

function refreshMessagesBadge() {
    $.get("/api/chats", { unreadOnly: true }, (data) => {
        
        var numResults = data.length;

        if(numResults > 0) {
            $("#messagesBadge").text(numResults).addClass("active");
        }
        else {
            $("#messagesBadge").text("").removeClass("active");
        }

    })
}
function refreshNotificationsBadge() {
	$.get("/api/notifications", { unreadOnly: true }, (data) => {
		var numResults = data.length;

		if(numResults > 0) {
			$("#notificationBadge").text(numResults).addClass("active");
		}
		else {
			$("#notificationBadge").text("").removeClass("active");
		}
	})
}

function showNotificationPopup(data) {
	var html = createNotificationHtml(data);
	var element = $(html);
	element.hide().prependTo("#notificationList").slideDown("fast");
	setTimeout(() => element.fadeOut(400), 5000)
}


function showMessagePopup(data) {
	if(!data.chat.latestMessage._id) { data.chat.latestMessage = data; }
	var html = createChatHtml(data.chat);
	var element = $(html);
	element.hide().prependTo("#notificationList").slideDown("fast");
	setTimeout(() => element.fadeOut(400), 5000)
}


function createNotificationHtml(notification) {
    var userFrom = notification.userFrom;
    var text = getNotificationText(notification);
    var href = getNotificationUrl(notification);
    var className = notification.opened ? "" : "active";

    return `<a class='resultListItem notification ${className}' href='${href}' data-id='${notification._id}'>
                <div class='resultsImageContainer'>
                    <img src='${userFrom.profilePic}' alt='User profile pic'>
                </div>

                <div class='resultsDetailsContainer ellipsis'>
                    <span class='ellipsis'>${text}</span>
                </div>
            </a>`
}

function getNotificationText(notification){
    var userFrom = notification.userFrom;

    if(!userFrom.firstName || !userFrom.lastName)  return alert("User Form Data was not found.")

    var userFromName = `${userFrom.firstName}  ${userFrom.lastName}`;

    var text;

    if(notification.notificationType == "retweet"){
        text = `${userFromName} reposted one of your posts`;
    }
    else if(notification.notificationType == "postLike"){
        text = `${userFromName} liked one of your posts`;
    }
    else if(notification.notificationType == "reply"){
        text = `${userFromName} replied one of your posts`;
    }
    else if(notification.notificationType == "follow"){
        text = `${userFromName} followed you`;
    }

    return `<span class='ellipses'>${text}</span>`;
}

function getNotificationUrl(notification){

    var url = "#";

    if(notification.notificationType == "retweet" || notification.notificationType == "postLike" || notification.notificationType == "reply" ){
        url = `/posts/${notification.entityId}`;
    }
    else if(notification.notificationType == "follow"){
        url = `/profile/${notification.entityId}`;
    }

    return url;
}

function outputChatList (chatList, container) {
    chatList.forEach(chat => {
        var html = createChatHtml(chat);
        container.append(html);
    });

    if(chatList.length == 0) {
        container.append("<span class='noResults'>Nothing to show</span>");
    }
}

function createChatHtml (chatData) {
    var chatName = getChatName(chatData); 
    var image = getChatImageElements(chatData);
    var latestMessage = getLatestMessage(chatData.latestMessage);

	var activeClass = !chatData.latestMessage || chatData.latestMessage.readBy.includes(userLoggedIn._id) ? "" : "active";

    return `<a class='resultListItem ${activeClass}' href='/messages/${chatData._id}'>
            ${image}
            <div class='resultsDetailsContainer ellipsis'>
                <span class='heading ellipsis'>${chatName}</span>
                <span class='subText ellipsis'>${latestMessage}</span>
            </div>
        </a>`;
}

function getLatestMessage(latestMessage) {
    if(latestMessage != null) {
        var sender = latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return "New Chat.";
}

function getChatImageElements(chatData) {
    var otherChatUsers = getOtherChatUsers(chatData.users);

    var groupChatClass = "";

    var chatImage = getUserChatImageElement(otherChatUsers[0]);

    if(otherChatUsers.length > 1) {
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImageElement(otherChatUsers[1]);
    }

    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`
}

function getUserChatImageElement(user) {
    if(!user || !user.profilePic) { return alert("User Passed into Function is invalid")};

    return `<img src='${user.profilePic}' alt='User\'s profile pic'>`;
}

$( window ).resize(function() {
	var isNavigatorMobileHidden = $("#navigatorBarMobile").is(":hidden");

	if(isMobileView) {
		if(isNavigatorMobileHidden) {
			$("#navigatorBarMobile").show();
			if(inChatPage) {$(".mainSectionContainer").css("max-height", "93%");}
		}
		else {
			$("#navigatorBarMobile").hide();
			if(inChatPage) {$(".mainSectionContainer").css("max-height", "100%");}
		}
	}

  });