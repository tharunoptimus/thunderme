$(document).ready(function () {
    $(".fa-user").css('color', 'var(--blue)');
});

$("#submitDetails").click(function (e) { 
    var firstName = $("#firstName").val().trim() != "" ? $("#firstName").val().trim() : undefined;
    var lastName = $("#lastName").val().trim() != "" ? $("#lastName").val().trim() : undefined;
    var personalEmail = $("#personalEmail").val().trim() != "" ? $("#personalEmail").val().trim() : undefined;
    var phone = $("#phone").val().trim() != "" ? $("#phone").val().trim() : undefined;
    var linkedIn = $("#linkedIn").val().trim() != "" ? $("#linkedIn").val().trim() : undefined;
    var personalURL = $("#personalURL").val().trim() != "" ? $("#personalURL").val().trim() : undefined;

    if(firstName == undefined || lastName == undefined) { return alert("Please Enter First Name and Last Name")} 

    $.ajax({
        url: "/api/users/updateprofiledetails",
        type: "PUT",
        data: { 
            firstName: firstName,
            lastName: lastName,
            personalEmail: personalEmail,
            phone: phone,
            linkedIn: linkedIn,
            personalURL: personalURL
        },
        success: ((data, status, xhr) => {
            if(xhr.status != 204) {
                alert("Could not update the new chat name");
            }
            else {
                window.location.href = "/profile";
            }
        })
    })

});