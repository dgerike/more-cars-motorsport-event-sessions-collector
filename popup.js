let racingSeries = [{
    "name": "WRC",
    "more_cars_id": 311,
    "source": "https://www.wrc.com/",
    "racing_series_indicator_title": "Live Timing",
    "selectors": {
        "table_selector": ".data-contel.full",
        "row_selector": "tbody tr",
        "stage": "td:nth-child(1)",
        "session_name": "td:nth-child(2)",
        "date": {
            "climb_up_dom_n_levels": 4,
            "selector": ".table-heading",
            "date_format": "dddd Do MMMM",
        },
        "start_time": "td:nth-child(4)",
    }
}]
let apiBaseUrl = 'https://more-cars.net'
let racingEventSessions = null

renderRacingSeriesList(racingSeries)

function renderRacingSeriesList(seriesList) {
    seriesList.forEach(series => {
        let html =
            '<option value="' + series.more_cars_id + '">' +
            series.name +
            '</option>'

        $('#racingSeriesList').append(html)
    })
}

$('#racingSeriesList').change(function () {
    let value = $(this).val();
    fetchRacingEventsFromMoreCars(value);
});

function fetchRacingEventsFromMoreCars(racingSeriesId) {
    let endpoint = '/racing-series/' + racingSeriesId + '/racing-events';

    $.ajax({
        type: 'GET',
        url: apiBaseUrl + '/api/v1' + endpoint,
    }).done(function (response) {
        let renderedEventList = renderEventList(response.data)
        $('#racingEventList').html(renderedEventList);
    }).fail(function (response, status) {

    });
}

function renderEventList(events) {
    let html = '';

    html += '<option selected disabled>--- Select Racing Event ---</option>'
    events.forEach(event => {
        html +=
            '<option value="' + event.id + '">' +
            'Round ' + event.round +
            ': ' + event.name +
            ' (' + event.start_date +
            ' - ' + event.end_date +
            ')' +
            '</option>'
    });

    return html;
}

$('#racingEventList').change(function () {
    $('#addRacingEventSessions').prop('disabled', false)
    $('#errorBox').addClass('d-none')
});

window.onload = function () {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        const currentUrl = tabs[0].url;
        const currentTitle = tabs[0].title;

        if (isSupportedRacingSeries(currentUrl, currentTitle)) {
            const currentRacingSeries = getRacingSeriesByUrl(currentUrl, currentTitle)

            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                const activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {
                    "message": "collect-sessions-data_REQUEST",
                    "selectors": currentRacingSeries.selectors
                });
            });

            chrome.runtime.onMessage.addListener(function (response) {
                if (response.message === "collect-sessions-data_RESPONSE") {
                    racingEventSessions = response.sessions
                    let renderedList = renderList(response.sessions)
                    $('#racingEventSessionList').html(renderedList)
                }
            })
        }
    });
};

function isSupportedRacingSeries(url, title) {
    return racingSeries.some(series => {
        const urlIsAMatch = url.includes(series.source)
        const titleIsAMatch = title.includes(series.racing_series_indicator_title)

        return urlIsAMatch && titleIsAMatch
    })
}

function getRacingSeriesByUrl(url, title) {
    for (let i = 0; i < racingSeries.length; i++) {
        const urlIsAMatch = url.includes(racingSeries[i].source)
        const titleIsAMatch = title.includes(racingSeries[i].racing_series_indicator_title)
        if (urlIsAMatch && titleIsAMatch) {
            return racingSeries[i]
        }
    }
}

function renderList(sessions) {
    let html = '';

    sessions.forEach(session => {
        html +=
            '<li class="list-group-item">' +
            '<b>' +
            '<span>' + session.stage + ' - </span>' +
            '<span>' + session.name + '</span>' +
            '</b>' +
            '<br>' +
            '<span> Date: ' + session.date + '</span>' +
            '<span class="float-right"> Start time: ' + session.time + '</span>' +
            '</li>';
    });

    return html;
}

let accessTokenInput = document.getElementById('accessTokenInput');
chrome.storage.local.get(['accessToken'], function (storage) {
    if (storage.accessToken) {
        accessTokenInput.value = storage.accessToken;
    }
});

let saveAccessTokenBtn = document.getElementById('saveAccessToken');
saveAccessTokenBtn.onclick = function () {
    let newAccessToken = document.getElementById('accessTokenInput').value;
    chrome.storage.local.set({'accessToken': newAccessToken});
};

let addRacingSessionsButton = document.getElementById('addRacingEventSessions');
addRacingSessionsButton.onclick = function () {
    addRacingSessions(racingEventSessions)
};

let totalSteps = 1
let stepSize = 1
let currentStep = 0
let progress = 0

function initializeProgressBar(stepCount) {
    totalSteps = stepCount
    stepSize = 100 / totalSteps
    currentStep = 0
    progress = 0
}

function updateProgress(steps) {
    currentStep = currentStep + steps
    progress = stepSize * currentStep
    $('#uploadProgress div').css('width', progress + '%')
    if (totalSteps === currentStep) {
        $('#uploadProgress div').text('Upload completed')
        $('#uploadProgress div').removeClass('progress-bar-animated')
    }
}

function isUploadDataValid(racingEventSessions) {
    if (!racingEventSessions || racingEventSessions.length === 0) {
        $('#errorBox').text('No racing event sessions found. Cannot proceed.')
        $('#errorBox').removeClass('d-none')
        $('#addRacingEventSessions').prop('disabled', true)

        return false
    }

    $('#errorBox').addClass('d-none') // remove error messages
    $('#addRacingEventSessions').prop('disabled', false) // enable submit button

    return true
}

function addRacingSessions(racingEventSessions) {
    if (!isUploadDataValid(racingEventSessions)) {
        return false
    }

    $('#addRacingEventSessions').prop('disabled', true)
    $('#uploadProgress').removeClass('d-none')
    initializeProgressBar(racingEventSessions.length * 2)

    racingEventSessions.forEach(racingEventSession => {
        uploadRacingEventSession(racingEventSession)
    })
}

function uploadRacingEventSession(racingEventSession) {
    let payloadRacingEventSession = {
        "name": racingEventSession.stage + ' - ' + racingEventSession.name,
        "start_time": racingEventSession.time,
        "start_date": racingEventSession.date,
    }

    let racingEventId = $($('#racingEventList option:selected')[0]).val()

    chrome.storage.local.get(['accessToken'], function (storage) {
        let endpoint = 'racing-event-sessions'
        $.ajax({ // create racing event session
            type: 'POST',
            contentType: 'application/json; charset=utf-8',
            url: apiBaseUrl + '/api/v1/' + endpoint,
            headers: {
                'access-token': storage.accessToken
            },
            data: JSON.stringify(payloadRacingEventSession)
        }).done(function (createdRacingEventSession) { // connect racing event and session
            updateProgress(1)

            const racingEventSessionId = createdRacingEventSession.data.id
            let endpoint2 = 'racing-event-sessions/' + racingEventSessionId + '/racing-events/' + racingEventId
            $.ajax({
                type: 'POST',
                url: apiBaseUrl + '/api/v1/' + endpoint2,
                headers: {
                    'access-token': storage.accessToken
                }
            })
        }).done(() => { // connect racing event and session
            updateProgress(1)
        })
    })
}