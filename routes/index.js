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
        "url": doc.view_uri
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
