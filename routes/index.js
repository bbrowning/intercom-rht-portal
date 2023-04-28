var express = require('express');
var router = express.Router();

router.get('/', (req, res) => {
  res.json({ hello: 'world' });
});

router.post('/initialize', (req, res) => {
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

router.post('/submit', (req, res) => {
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
          },
          {
            "type": "spacer",
            "size": "s"
          },
          {
		        "type": "text",
  	        "text": "*Search results:'*",
  		      "style": "paragraph"
	        },
          {
            "type": "list",
            "items": [
              {
                "type": "item",
                "id": "list-item-1",
                "title": "Item 1",
                "subtitle": "With Action",
                "action": {
                  "type": "submit"
                }
              },
              {
                "type": "item",
                "id": "list-item-2",
                "title": "Item 2",
                "subtitle": "With Action",
                "action": {
                  "type": "submit"
                }
              },
            ]
          }
        ]
      },
      stored_data: { "key": "value" } //Can be more than one pair
    }
  });
});

module.exports = router;
