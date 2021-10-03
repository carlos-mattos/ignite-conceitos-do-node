const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const username = request.headers.username;

  const user = users.find((user) => user.username === username);

  if (user != undefined) {
    request.userExists = true;
    request.user = user;

    next();
  } else {
    return response.status(404).json({ error: "Usuário não encontrado" });
  }
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  const userAlreadyExists = users.some((user) => user.username === username);

  if (userAlreadyExists) {
    return response
      .status(400)
      .json({ error: "Já existe um usuário com esse username" });
  }

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  try {
    if (!request.userExists) {
      return response.json({
        success: false,
        message: "Usuário não encontrado ou inexistente",
      });
    }

    const userTodos = request.user.todos;

    return response.json(userTodos);
  } catch (error) {
    return response.json({ success: false, error });
  }
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const username = request.headers.username;

  if (!request.userExists) {
    return response.json({
      success: false,
      message: "Usuário não encontrado ou inexistente",
    });
  }

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  const index = users.findIndex((user) => user.username === username);

  users[index].todos.push(newTodo);

  return response.status(201).json(newTodo);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  try {
    const todoId = request.params.id;
    const { title, deadline } = request.body;
    const username = request.headers.username;

    if (!request.userExists) {
      return response.json({
        success: false,
        message: "Usuário não encontrado ou inexistente",
      });
    }

    const indexUser = users.findIndex((user) => user.username === username);

    const userTodos = request.user.todos;

    const indexTodo = userTodos.findIndex((todo) => todo.id === todoId);

    if (indexTodo < 0) {
      return response
        .status(404)
        .json({ error: "Não encontramos a tarefa passada..." });
    }

    const oldTodo = users[indexUser].todos[indexTodo];
    const todoUpdated = {
      id: oldTodo.id,
      title,
      done: oldTodo.done,
      deadline,
      created_at: oldTodo.created_at,
    };

    users[indexUser].todos[indexTodo] = todoUpdated;

    return response.json(todoUpdated);
  } catch (error) {
    return response.json({
      error: "Não foi possível atualizar o registro",
    });
  }
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  try {
    const todoId = request.params.id;
    const username = request.headers.username;

    if (!request.userExists) {
      return response.json({
        success: false,
        message: "Usuário não encontrado ou inexistente",
      });
    }

    const indexUser = users.findIndex((user) => user.username === username);

    const userTodos = request.user.todos;

    const indexTodo = userTodos.findIndex((todo) => todo.id === todoId);

    if (indexTodo < 0) {
      return response
        .status(404)
        .json({ error: "Não encontramos a tarefa passada..." });
    }

    const todo = users[indexUser].todos[indexTodo];

    users[indexUser].todos[indexTodo].done = true;

    return response.json(todo);
  } catch (error) {
    return response.json({
      message: "Não foi possível atualizar o status para 'Feito'",
    });
  }
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  try {
    const todoId = request.params.id;
    const username = request.headers.username;

    if (!request.userExists) {
      return response.json({
        success: false,
        message: "Usuário não encontrado ou inexistente",
      });
    }

    const indexUser = users.findIndex((user) => user.username === username);

    const userTodos = request.user.todos;

    const indexTodo = userTodos.findIndex((todo) => todo.id === todoId);

    if (indexTodo < 0) {
      return response
        .status(404)
        .json({ error: "Não encontramos a tarefa passada..." });
    }

    users[indexUser].todos.splice(indexTodo, 1);

    return response.status(204).json({
      success: true,
      message: "Tarefa deletada com sucesso!",
    });
  } catch (error) {
    return response.json({
      success: false,
      message: "Tarefa deletada com sucesso!",
    });
  }
});

module.exports = app;
