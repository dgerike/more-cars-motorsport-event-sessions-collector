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
