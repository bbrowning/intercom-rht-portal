var express = require('express');
var querystring = require('querystring');
var router = express.Router();

const axios = require('axios');

// unused except for manual testing / health check
router.get('/', (req, res) => {
  res.json({ ok: 'true' });
});


function portalSearchComponents(value) {
  return [
    {
      "type": "text",
      "text": "Search the customer portal",
      "style": "header"
    },
    {
      "type": "input",
      "id": "portal-search",
      "placeholder": value ? "" : "Search for answers...",
      "value": value ? value : "",
      "style": "secondary",
      "action": {
        "type": "submit"
      }
    }
  ];
}

router.post('/initialize', (req, res, next) => {
  // console.log("request json: %j", req.body);
  res.json({
    canvas: {
      content: {
        components: portalSearchComponents()
      }
    }
  });
});

router.post('/submit', (req, res, next) => {
  console.log(req.body?.component_id);
  console.log(req.body?.input_values);
  switch (req.body?.component_id) {
  case "portal-search":
  case "portal-search-pagination":
    submitPortalSearch(req, res, next);
    break;
  case "clear-portal-search":
    clearPortalSearch(req, res, next);
    break;
  default:
    submitErrorResponse(req, res, next, "Sorry, an error occured.");
  }
});

function submitErrorResponse(req, res, next, message) {
  var components = portalSearchComponents();
  components = components.concat([
    {
      "type": "spacer",
      "size": "s"
    },
    {
      "type": "text",
      "text": message,
      "style": "paragraph"
	  }
  ]);
  res.json({
    canvas: {
      content: {
        components: components
      }
    }
  });
}

const searchResultsPerPage = 3;

async function submitPortalSearch(req, res, next) {
  // console.log("request json: %j", req.body);
  // console.log("input values: %j", req.body.input_values);

  // TODO: Use browser language in the language filter below?
  // Showing results in multiple different languages is confusing, but
  // hardcoding en is also bad

  const searchStr = req.body.input_values["portal-search"];
  if (!searchStr) {
    return submitErrorResponse(req, res, next, "");
  }

  // Handle pagination
  var prevSearchStart = req.body.current_canvas?.stored_data?.searchStart;
  const isPaginating = req.body?.component_id == "portal-search-pagination";
  const pageDirection = req.body.input_values["portal-search-pagination"] || "";
  console.log("isPaginating: %s, pageDirection: %s", isPaginating, pageDirection);
  var searchStart = 0;
  if (!prevSearchStart) {
    prevSearchStart = 0;
  }
  if (prevSearchStart > 0 && pageDirection == "previous") {
    searchStart = prevSearchStart - searchResultsPerPage;
    if (searchStart < 0) {
      searchStart = 0;
    }
  } else if (pageDirection == "next") {
    searchStart = prevSearchStart + searchResultsPerPage;
  }
  console.log("searchStart: %s", searchStart);

  const searchQuery = querystring.stringify({
    q: searchStr,
    fq: `language:en AND product:"Red Hat OpenShift Service on AWS"`,
    fl: "id,publishedTitle,view_uri,documentKind,product",
    start: searchStart,
    rows: searchResultsPerPage
  });
  const searchResponse = await axios.get(`https://access.redhat.com/hydra/rest/search/kcs?${searchQuery}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  // const searchResponse = await axios.post(`https://access.redhat.com/hydra/rest/search/v2/kcs`, {
  //   q: searchStr,
  //   fq: "documentKind:Solution",
  //   fl: "id,publishedTitle,view_uri",
  //   rows: 3,
  // }, {
  //   headers: {
  //     "Content-Type": "application/json"
  //   }
  // });
  // console.log("search response: %j", searchResponse.data);

  const numResults = searchResponse.data?.response?.numFound;
  const docs = searchResponse.data?.response?.docs;
  var searchResults;
  var storedSearch;
  if (!docs || !numResults) {
    searchResults = [];
    storedSearch = {};
  } else {
    searchResults = searchResponse.data?.response?.docs?.map(doc => {
      return {
        "type": "item",
        "id": doc.id,
        "title": doc.publishedTitle,
        "subtitle": doc.documentKind,
        "action": {
          // "type": "sheet",
          // "url": `https://${req.get('host')}/sheet`
          "type": "url",
          "url": doc.view_uri
        }
      }
    });
    storedSearch = searchResponse.data?.response?.docs?.map(doc => {
      return {
        "id": doc.id,
        "title": doc.publishedTitle,
        "view_uri": doc.view_uri
      }
    });
  }

  // console.log("search results array: %j", searchResults);
  // console.log("stored search data: %j", storedSearch);

  var components = portalSearchComponents(searchStr);
  components = components.concat([
    {
      "type": "spacer",
      "size": "s"
    },
    {
      "type": "text",
      "text": "*Search results:*",
      "style": "paragraph"
	  },
    {
      "type": "list",
      "items": searchResults
    },
    {
      "type": "single-select",
      "id": "portal-search-pagination",
      "options": [
        {
          "type": "option",
          "id": "previous",
          "text": "Previous",
          "disabled": searchStart < 1
        },
        {
          "type": "option",
          "id": "next",
          "text": "Next",
          "disabled": searchStart + searchResultsPerPage > numResults
        }
      ],
      "action": {
        "type": "submit"
      }
    },
    {
      "type": "button",
      "id": "clear-portal-search",
      "label": "Clear Results",
      "style": "link",
      "action": {
        "type": "submit"
      }
    }
  ]);
  res.json({
    canvas: {
      content: {
        components: components
      },
      stored_data: { "searchResults": storedSearch, "searchStart": searchStart }
    }
  });
}

function clearPortalSearch(req, res, next) {
  res.json({
    canvas: {
      content: {
        components: portalSearchComponents()
      }
    }
  });
}

// For now, the sheet stuff below is unused and we'll
// just open in a new tab
router.post('/sheet', async (req, res, next) => {
  console.log("request json: %j", req.body);

  const data = JSON.parse(req.body?.intercom_data);
  console.log("current_canvas: %j", data.current_canvas);
  console.log("stored_data: %j", data.current_canvas?.stored_data);
  console.log("component_id: %j", data.component_id);

  const searchResults = data.current_canvas?.stored_data?.searchResults;
  const componentId = data.component_id;
  if (!searchResults || !componentId) {
    res.status(500).send("Something went wrong");
    return;
  }

  const thisResult = searchResults.find(({ id }) => id === componentId);
  console.log("this result is %j", thisResult);

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>${thisResult.title}</title>
  <!-- Adding the Messenger Sheet Library -->
  <script src="https://s3.amazonaws.com/intercom-sheets.com/messenger-sheet-library.latest.js"></script>
</head>
<body>
  <button id="done">Done</button>
  <button id="close">Close</button>

  <!-- Example of using a Messenger Sheet Library method -->
  <script>
    const done = document.querySelector('#done');
    done.addEventListener('click', () => {
      INTERCOM_MESSENGER_SHEET_LIBRARY.submitSheet({ super: "secret" });
    });

    const clone = document.querySelector('#close');
    close.addeventListener('click', () => {
      INTERCOM_MESSENGER_SHEET_LIBRARY.closeSheet();
    });
  </script>

  <h1>Hi there</h1>
  <iframe src="${thisResult.view_uri}" width="100px" height="100px"></iframe>
</body>
</html>
  `);
});

module.exports = router;
