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

router.get('/submit', (req, res) => {
  res.json({ test: 'foo' });
});

module.exports = router;
