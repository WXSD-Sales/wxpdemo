const offset = new Date().getTimezoneOffset();
var today = new Date();
var defaultDate = new Date(today);
defaultDate.setDate(today.getDate() + 1);
var time = today.toISOString().slice(11,16);
let picked_date = defaultDate.toISOString().slice(0,10) + " " + time;
document.getElementById('selected_expiry').innerHTML = picked_date;
//console.log(`today is ${time}`);
//console.log(`today is ${today}`);
//console.log(picked_date);
let urlPath = window.location.pathname;
let deployPath = urlPath.split('/linkgen')[0];
console.log(deployPath);

flatpickr("#flatpckr", {
  enableTime: true,
  dateFormat: "Y-m-d H:i",
  minDate: "today",
  minTime: time,
  defaultDate: picked_date,
  onChange: function(selectedDates, dateStr, instance) {
    console.log(`selection changed ${dateStr} `);
    picked_date = dateStr;
    document.getElementById('selected_expiry').innerHTML = picked_date;
  },
  allowInput: true,
});


let create_button = document.getElementById('create_button');
create_button.onclick = function (event){
  try {
    create_guest_data_object()
    .then((result) => {
      console.log (result)
      if (result){
        post_data();
      } else {

      }
    });
  }
  catch (err){
    console.log(err);
  }
}

$("#sipuri").focus(function(){
  $('.radio-input[name=sip_uri][value=custom]').prop("checked", true);
})

$("#sip_uri_radio-pmr").click(function(){
  $('.radio-input[name=sip_uri][value=pmr]').prop("checked", true);
})

let guest_data = {};
async function create_guest_data_object(){
  let sipval = $("input[type='radio'][name='sip_uri']:checked").val();
  if(sipval == "custom") sipval = document.getElementById('sipuri').value;
  guest_data.sip_target = sipval;
  guest_data.expiry_date = picked_date;
  guest_data.offset = offset;
  return guest_data;
};

async function validate_message_object(message){
  if(!message.expiry_date || !message.sip_target){
    showMessage(`{"error":"Oops, you seem to be missing something.."}`);
    return false;
  } else {
    console.log (JSON.stringify(message));
    document.getElementById('selected_expiry').innerHTML = message.expiry_date;
    return true;
  }
};

async function post_data(){
  fetch(deployPath + '/create_url', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(guest_data),
  })
  .then(handleResponse)
  .then(showMessage)
  .catch(function(err) {
    showMessage(err.message);
  });
};

function copyFunction(url){
  const el = document.createElement('textarea');
  el.value = url;
  document.body.appendChild(el);
  el.select();
  el.setSelectionRange(0,99999); /*for mobile devices*/
  document.execCommand("copy");
  document.body.removeChild(el);
}

function buildTable(response_message){
  let table = $('<table>', {class:"link-table"})
      .append($('<tr>')
        .append($('<td>', {class:"link-cell"}).text('Message'))
        .append($('<td>', {class:"link-cell"}).text(response_message['message'])))
  if(response_message.hasOwnProperty('expires'))
    table.append($('<tr>')
      .append($('<td>', {class:"link-cell"}).text('Expires'))
      .append($('<td>', {class:"link-cell"}).text(response_message['expires']))
    )
  if(response_message.hasOwnProperty('urls')){
    for(let urlType in response_message['urls']){
      table.append($('<tr>', {class:"header-row"})
        .append($('<td>', {class:"link-cell", "style":"font-weight:bold"}).text(urlType + ' URLs'))
        .append($('<td>', {class:"link-cell"})));
      for(let url in response_message['urls'][urlType]){
        let cellTitle = "SDK";
        if(response_message['urls'][urlType][url].indexOf("widget") > 0) cellTitle = "Widget";
        table.append($('<tr>')
          .append($('<td>', {class:"link-cell"}).text(cellTitle))
          .append($('<td>', {class:"link-cell"})
            .append($('<a>').attr("id", "generated-link-url")
                            .attr("href", response_message['urls'][urlType][url])
                            .attr("target", "_blank")
                            .text(response_message['urls'][urlType][url]))
            .append($('<button>', {class:'md-button md-button--circle md-button--32 copy-button', onclick:'copyFunction("'+response_message['urls'][urlType][url]+'")'})
              .append($('<i>', {class:'cui-icon icon icon-copy_16'}))
            )
          )
        )
      }
    }
  }

  return table;
}

function showMessage(response_message) {
  if(response_message == "null"){
    alert("Error: Cannot Find PMR for you. Please enter a SIP URI or roomId");
  } else {
    console.log(response_message)
    let jResponse = JSON.parse(response_message);
    $("#messages").empty();
    $("#messages").append(buildTable(jResponse));
    messages.scrollTop = messages.scrollHeight;
    console.log(jResponse);
    if(jResponse.hasOwnProperty('urls')){
      console.log(`URL found - ${jResponse.urls}`)
      document.getElementById('send_as_email_section').style.display = 'block';
      document.getElementById('guest_info_section').style.display = 'none';
    };
  }

}

function handleResponse(response) {
  return response.ok
    ? response.json().then((data) => JSON.stringify(data, null, 2))
    : Promise.reject(new Error('Unexpected response'));
}


console.log(`timezone offset = ${offset}`);

async function send_to_email(){

  guest_data.send_to_email = document.getElementById('send_to_email').value;
  console.log(guest_data);

  fetch(deployPath + '/email_invite', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(guest_data),
  })
  .then(handleResponse)
  .then(showMessage)
  .catch(function(err) {
    showMessage(err.message);
  });


}

async function send_to_sms(){
  guest_data.send_to_mobile = document.getElementById('send_to_mobile').value;
  console.log(guest_data);
}
