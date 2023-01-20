function extractDataPoint(baseSelector, fieldName, selectors) {
    if (!selectors[fieldName]) {
        return null
    }

    if (!document.querySelector(baseSelector + ' ' + selectors[fieldName])) {
        return null
    }

    let childNode = 0
    if (selectors[fieldName + '_childnode']) {
        childNode = selectors[fieldName + '_childnode']
    }

    if (!document.querySelector(baseSelector + ' ' + selectors[fieldName]).childNodes[childNode]) {
        return null
    }

    let datapoint = document
        .querySelector(baseSelector + ' ' + selectors[fieldName])
        .childNodes[childNode]
        .textContent
        .trim()

    if (selectors[fieldName + '_suffix']) {
        let suffixElement = document.querySelector(baseSelector + ' ' + selectors[fieldName + '_suffix'])
        if (suffixElement) {
            let suffix = suffixElement.textContent
            datapoint = datapoint + suffix
        }
    }

    if (selectors[fieldName + '_attribute']) {
        datapoint = document
            .querySelector(baseSelector + ' ' + selectors[fieldName])
            .getAttribute(selectors[fieldName + '_attribute'])
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
    const nthChild = getRowNumberForCurrentPosition(pos, selectors)
    const baseSelector = selectors.table_selector + ' ' + selectors.row_selector + ':nth-of-type(' + nthChild + ')'

    const stage = extractDataPoint(baseSelector, 'stage', selectors)
    const name = extractDataPoint(baseSelector, 'session_name', selectors)
    const time = extractDataPoint(baseSelector, 'start_time', selectors)

    return {
        "stage": stage,
        "name": name,
        "time": time,
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

    for (let i = 1; i <= sessionsCount; i++) {
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
