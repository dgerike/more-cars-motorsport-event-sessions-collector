function extractDataPoint(baseSelector, rowNumber, fieldName, selectors) {
    let datapoint = null;

    if (typeof selectors[fieldName] === "string") {
        datapoint = $(baseSelector)
            .eq(rowNumber)
            .find(selectors[fieldName])
            .text()
            .trim()
    }

    if (typeof selectors[fieldName] === "object") {
        let selected = $(baseSelector)
            .eq(rowNumber)

        for (let i = 1; i <= selectors[fieldName]['climb_up_dom_n_levels']; i++) {
            selected = selected.parent()
        }

        datapoint = selected
            .find(selectors[fieldName]['selector'])
            .text()
            .trim()
    }

    return datapoint
}

function getRowNumberForCurrentPosition(pos, selectors) {
    let nthChild = pos

    if (selectors.skip_rows) {
        nthChild = 2 * (selectors.skip_rows + pos - 1) - 1
    }

    if (selectors.skip_first_n_rows) {
        nthChild += selectors.skip_first_n_rows
    }

    return nthChild
}

function extractSessionForPosition(pos, selectors) {
    const rowNumber = getRowNumberForCurrentPosition(pos, selectors)
    const baseSelector = selectors.table_selector + ' ' + selectors.row_selector

    const stage = extractDataPoint(baseSelector, rowNumber, 'stage', selectors)
    const name = extractDataPoint(baseSelector, rowNumber, 'session_name', selectors)
    const time = extractDataPoint(baseSelector, rowNumber, 'start_time', selectors)
    const date = extractDataPoint(baseSelector, rowNumber, 'date', selectors)
    const formattedDate = moment(date, selectors['date']['date_format']).format("YYYY-MM-DD")

    return {
        "stage": stage,
        "name": name,
        "time": time,
        "date": formattedDate,
    }
}

function extractAllSessions(selectors) {
    const sessions = []

    let sessionsCount = document.querySelectorAll(selectors.table_selector + ' ' + selectors.row_selector).length

    if (selectors.skip_first_n_rows) {
        sessionsCount -= selectors.skip_first_n_rows
    }

    if (selectors.skip_rows) {
        sessionsCount = Math.ceil(sessionsCount / (selectors.skip_rows + 1))
    }

    for (let i = 0; i < sessionsCount; i++) {
        let session = extractSessionForPosition(i, selectors)

        sessions.push(session)
    }

    return sessions
}

chrome.runtime.onMessage.addListener(
    function (request) {
        if (request.message === "collect-sessions-data_REQUEST") {
            const sessions = extractAllSessions(request.selectors)

            chrome.runtime.sendMessage({
                "message": "collect-sessions-data_RESPONSE",
                "sessions": sessions,
            })
        }
    }
);
