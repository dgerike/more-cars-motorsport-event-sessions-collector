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
        "date": ".table-heading",
        "start_time": "td:nth-child(4)",
    }
}]
let apiBaseUrl = 'https://more-cars.net'

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
