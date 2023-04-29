var express = require('express');
var querystring = require('querystring');
var router = express.Router();

const axios = require('axios');

router.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

router.post('/initialize', (req, res, next) => {
  // console.log("request json: %j", req.body);
  res.json({
    canvas: {
      content: {
        components: [
          {
            "type": "text",
            "text": "Search the customer portal",
            "style": "header"
          },
          {
            "type": "input",
            "id": "portal-search",
            "placeholder": "Search for answers...",
            "style": "secondary",
            "action": {
              "type": "submit"
            }
          }
        ]
      },
      stored_data: { "key": "value" } //Can be more than one pair
    }
  });
});

router.post('/submit', async (req, res, next) => {
  // console.log("request json: %j", req.body);
  // console.log("input values: %j", req.body.input_values);

  const searchStr = req.body.input_values["portal-search"];
  const searchQuery = querystring.stringify({
    q: searchStr,
    fq: `product:"Red Hat OpenShift Service on AWS"`,
    fl: "id,publishedTitle,view_uri,documentKind,product",
    rows: 4,
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
  console.log("search response: %j", searchResponse.data);

  const docs = searchResponse.data?.response?.docs;
  var searchResults;
  var storedSearch;
  if (!docs) {
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
  
  res.json({
    canvas: {
      content: {
        components: [
          {
		        "type": "text",
            "text": "Search the customer portal",
            "style": "header"
          },
          {
		        "type": "input",
            "id": "portal-search",
            "value": searchStr,
            "style": "secondary",
            "action": {
              "type": "submit"
            }
          },
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
          }
        ]
      },
      stored_data: { "searchResults": storedSearch }
    }
  });
});

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
