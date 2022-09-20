const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const path = require("path");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("sever running successfully");
    });
  } catch (e) {
    console.log(`DB ERROR: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const statusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const withStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const withPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
//get whose status is " TO DO"

app.get("/todos/", async (request, response) => {
  let todoArray = null;
  let getTOdoQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case statusAndPriority(request.query):
      getTOdoQuery = `
               SELECT 
                 *
               FROM 
                 todo
               WHERE
                 todo LIKE '%${search_q}%'
                   AND
                 priority = '${priority}'
                   AND
                 status = '${status}';
            `;
      break;
    case withStatus(request.query):
      getTOdoQuery = `
               SELECT
                 *
               FROM 
                 todo
               WHERE
                todo LIKE '%${search_q}%'
                   AND
                status = '${status}';
                 
            `;
      break;
    case withPriority(request.query):
      getTOdoQuery = `
               SELECT
                 *
               FROM 
                 todo
               WHERE
                todo LIKE '%${search_q}%'
                   AND
                priority = '${priority}';
                 
            `;
      break;
    default:
      getTOdoQuery = `
               SELECT
                 *
               FROM 
                 todo
               WHERE
                todo LIKE '%${search_q}%';`;
  }
  todoArray = await db.all(getTOdoQuery);
  response.send(todoArray);
});

// get todo based on the todo id

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT
           * 
        FROM 
          todo
        WHERE
          id = ${todoId};
    `;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//posting new data into to list

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postQuery = `
        INSERT INTO 
            todo(id,todo,priority,status)
        VALUES
           (
               ${id},
               '${todo}',
               '${priority}',
               '${status}'
           );
        
    `;
  await db.run(postQuery);
  response.send("Todo Successfully Added");
});

//changing values by put method

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatedValue = "";
  const newValue = request.body;
  switch (true) {
    case newValue.status !== undefined:
      updatedValue = "Status";
      break;
    case newValue.priority !== undefined:
      updatedValue = "Priority";
      break;
    case newValue.todo !== undefined:
      updatedValue = "Todo";
      break;
  }
  const beforeUpdated = `
         SELECT 
           * 
        FROM 
           todo
         WHERE
           id = ${todoId};
   `;
  const beforeValues = await db.get(beforeUpdated);
  const {
    todo = beforeValues.todo,
    priority = beforeValues.priority,
    status = beforeValues.status,
  } = request.body;

  const updateTodo = `
        UPDATE 
          todo
        SET 
          todo = '${todo}',
          priority = '${priority}',
          status = '${status}'
        WHERE
           id = ${todoId};
    `;

  await db.run(updateTodo);
  response.send(`${updatedValue} Updated`);
});

//DELETE A TODO FROM DB

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
         DELETE FROM 
             todo
        WHERE 
           id = ${todoId};
    `;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
