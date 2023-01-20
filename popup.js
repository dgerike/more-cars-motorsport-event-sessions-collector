let racingSeries = [{
    "name": "WRC",
    "more_cars_id": 311
}]

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
