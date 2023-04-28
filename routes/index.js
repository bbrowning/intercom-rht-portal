var express = require('express');
var querystring = require('querystring');
var router = express.Router();

const axios = require('axios');

router.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

router.post('/initialize', (req, res, next) => {
  console.log("request json: %j", req.body);
  res.json({
    canvas: {
      content: {
        components: [
          {
		        "type": "text",
            "text": "Find an answer quickly",
            "style": "header"
          },
          {
		        "type": "input",
            "id": "article-search",
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

router.post('/sheet', async (req, res, next) => {
  console.log("request json: %j", req.body);

  // https://access.redhat.com/solutions/5034771

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Sheet 1</title>
  <!-- Adding the Messenger Sheet Library -->
  <script src="https://s3.amazonaws.com/intercom-sheets.com/messenger-sheet-library.latest.js"></script>
</head>
<body>
  <button id="done">Done</button>

  <!-- Example of using a Messenger Sheet Library method -->
  <script>
    const done = document.querySelector('#done');
    done.addEventListener('click', () => {
      INTERCOM_MESSENGER_SHEET_LIBRARY.submitSheet({ super: "secret" });
    });
  </script>

  <h1>Hi there</h1>
</body>
</html>
  `);
});

router.post('/submit', async (req, res, next) => {
  console.log("request json: %j", req.body);
  console.log("input values: %j", req.body.input_values);

  const searchStr = req.body.input_values["article-search"];
  // const searchQuery = querystring.stringify({"q": searchStr});
  const searchResponse = await axios.post(`https://api.access.redhat.com/support/search/v2/kcs`, {
    q: searchStr,
    rows: 3,
  }, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  console.log("search response: %j", searchResponse.data);

  const searchResults = searchResponse.data?.response?.docs?.map(doc => {
    return {
      "type": "item",
      "id": doc.id,
      "title": doc.publishedTitle,
      "subtitle": "",
      "action": {
        "type": "sheet",
        "url": `https://${req.get('host')}/sheet`
      }
    }
  });
  console.log("search results array: %j", searchResults);
  
  res.json({
    canvas: {
      content: {
        components: [
          {
		        "type": "text",
            "text": "Find an answer quickly",
            "style": "header"
          },
          {
		        "type": "input",
            "id": "article-search",
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
      stored_data: { "key": "value" } //Can be more than one pair
    }
  });
});

module.exports = router;
