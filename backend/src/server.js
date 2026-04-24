import app from "./app.js";
import configs from "./config/index.js";

const PORT = configs.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on Port ${PORT}`);
});
