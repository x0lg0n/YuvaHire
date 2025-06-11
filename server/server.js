// const app = require('../client/yuva-hire/app');
const app = require('./app')

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

