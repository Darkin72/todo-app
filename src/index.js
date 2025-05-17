// Try to load tasks from localStorage
let task = JSON.parse(localStorage.getItem("todoTasks")) || {
  Personal: {},
};

let currentProject = localStorage.getItem("currentProject") || "Personal";
let selectedPriority = null;

// Function to save tasks to localStorage
function saveTasks() {
  localStorage.setItem("todoTasks", JSON.stringify(task));
  localStorage.setItem("currentProject", currentProject);
}

window.addProject = addProject;
window.changeProject = changeProject;
window.addTask = addTask;
window.selectPriority = selectPriority;
window.filterTaskAndUpdateButton = filterTaskAndUpdateButton;

// Setup event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Set default project
  changeProject("Personal");

  // Set default priority
  selectPriority("None");

  // Prevent form submission
  const form = document.querySelector(".add-task");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Form submission prevented");
    });
  }
});

function addProject() {
  const inputElement = document.querySelector(".add-project-input");
  const projectName = inputElement.value.trim();

  if (!projectName) {
    alert("Project name cannot be empty!");
    return;
  }

  if (task[projectName]) {
    alert("Project already exists!");
    return;
  }

  task[projectName] = {};

  // Save the updated projects to localStorage
  saveTasks();

  const projectList = document.querySelector(".project-list");
  const newProjectItem = document.createElement("li");

  newProjectItem.innerHTML = `
    <button type="button" class="project-button" onclick="changeProject('${projectName}')">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="Layer_1"
          data-name="Layer 1"
          viewBox="0 0 24 24"
          width="512"
          height="512"
          class="project-icon"
        >
          <path
            d="m23.882,8l.118-1h-6.469l.841-7h-1.053l-.841,7h-7.842l.841-7h-1.053l-.841,7H.941l-.118,1h6.639l-.841,7H.118L0,16h6.502l-.961,8h1.053l.961-8h7.842l-.961,8h1.053l.961-8h6.726l.118-1h-6.724l.841-7h6.472Zm-8.365,7h-7.842l.841-7h7.842l-.841,7Z"
          />
        </svg>
        ${projectName}
      </div>
    </button>
    ${
      projectName !== "Personal"
        ? `<button class="delete-project-btn" data-project="${projectName}" aria-label="Delete project">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>`
        : ""
    }
  `;

  projectList.appendChild(newProjectItem);

  // Add event listener for delete project button
  const deleteBtn = newProjectItem.querySelector(".delete-project-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation(); // Prevent project selection when clicking delete
      const projectToDelete = this.getAttribute("data-project");
      deleteProject(projectToDelete);
    });
  }

  inputElement.value = "";
  changeProject(projectName);
}

function changeProject(projectName) {
  if (!projectName || !task[projectName]) {
    console.error("Invalid project name:", projectName);
    return;
  }

  currentProject = projectName;

  // Update the project name in the UI
  const mainTitle = document.querySelector("main h1");
  mainTitle.textContent = projectName;

  // Update the navigation path
  const currentProjectSpan = document.querySelector(".current-project");
  if (currentProjectSpan) {
    currentProjectSpan.textContent = projectName;
  }

  // Reset filter to "All" when changing projects
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    if (btn.getAttribute("data-filter") === "all") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const projectButtons = document.querySelectorAll(".project-button");
  projectButtons.forEach((button) => {
    const projectText = button.querySelector("div").textContent.trim();
    if (projectText === projectName) {
      button.classList.add("project-active");
    } else {
      button.classList.remove("project-active");
    }
  });

  const existingTaskList = document.querySelector(".task-list");
  if (existingTaskList) {
    existingTaskList.innerHTML = "";
  }

  displayTasks(projectName);
}

function displayTasks(projectName) {
  const projectTasks = task[projectName];

  let taskList = document.querySelector(".task-list");
  if (!taskList) {
    taskList = document.createElement("div");
    taskList.className = "task-list";
    document.querySelector("main").appendChild(taskList);
  }

  taskList.innerHTML = "";

  if (Object.keys(projectTasks).length === 0) {
    taskList.innerHTML = "<p class='no-tasks'>No tasks yet. Add one above!</p>";
    return;
  }
  for (const taskId in projectTasks) {
    const taskData = projectTasks[taskId];
    const taskElement = document.createElement("div");
    taskElement.className = "task-item";

    // Add completed class if task is completed
    if (taskData.completed) {
      taskElement.classList.add("completed");
    }

    taskElement.innerHTML = `
      <div class="task-content">
        <input type="checkbox" id="task-${taskId}" ${
      taskData.completed ? "checked" : ""
    }>
        <label for="task-${taskId}">${taskData.description}</label>
      </div>
      <div class="task-priority ${taskData.priority} ">
        <span class="priority-dot ${taskData.priority}"></span>
        ${taskData.priority}
      </div>
      <button class="delete-task-btn" data-task-id="${taskId}" aria-label="Delete task">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
        </svg>
      </button>
    `;

    taskList.appendChild(taskElement);

    // Add event listener for checkbox to mark task as completed
    const checkbox = taskElement.querySelector(`input[type="checkbox"]`);
    checkbox.addEventListener("change", function () {
      toggleTaskCompletion(taskId);
    });

    // Add event listener for delete button
    const deleteBtn = taskElement.querySelector(".delete-task-btn");
    deleteBtn.addEventListener("click", function () {
      deleteTask(taskId);
    });
  }
}

// Function to toggle task completion status
function toggleTaskCompletion(taskId) {
  if (task[currentProject][taskId]) {
    task[currentProject][taskId].completed =
      !task[currentProject][taskId].completed;
    saveTasks();
    displayTasks(currentProject);
  }
}

// Function to delete a task
function deleteTask(taskId) {
  if (task[currentProject][taskId]) {
    delete task[currentProject][taskId];
    saveTasks();
    displayTasks(currentProject);
  }
}

// Function to delete a project
function deleteProject(projectName) {
  if (projectName === "Personal") {
    alert("Cannot delete the default Personal project");
    return;
  }

  if (
    confirm(
      `Are you sure you want to delete the project "${projectName}" and all its tasks?`
    )
  ) {
    delete task[projectName];
    saveTasks();

    // Remove project from DOM
    const projectButtons = document.querySelectorAll(".project-button");
    projectButtons.forEach((button) => {
      const projectText = button.querySelector("div").textContent.trim();
      if (projectText === projectName) {
        button.closest("li").remove();
      }
    });

    // Switch to Personal project
    changeProject("Personal");
  }
}

// Function to filter tasks
function filterTasks(filterType) {
  const allTasks = document.querySelectorAll(".task-item");

  switch (filterType) {
    case "all":
      allTasks.forEach((task) => (task.style.display = "flex"));
      break;
    case "active":
      allTasks.forEach((task) => {
        task.style.display = task.classList.contains("completed")
          ? "none"
          : "flex";
      });
      break;
    case "completed":
      allTasks.forEach((task) => {
        task.style.display = task.classList.contains("completed")
          ? "flex"
          : "none";
      });
      break;
  }
}

// Function to filter tasks and update button active state
function filterTaskAndUpdateButton(filterType, button) {
  // Filter tasks
  filterTasks(filterType);

  // Update active state of filter buttons
  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.classList.remove("active");
  });
  button.classList.add("active");
}

function selectPriority(priority) {
  if (priority === "None") {
    const priorityButtons = document.querySelectorAll(".priority-btn");
    priorityButtons.forEach((btn) => {
      if (btn.classList.contains(priority)) {
        btn.classList.remove("selected");
      }
    });
    return;
  }

  selectedPriority = priority;

  const priorityButtons = document.querySelectorAll(".priority-btn");
  priorityButtons.forEach((btn) => {
    if (btn.classList.contains(priority)) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });
}

function addTask() {
  if (!selectedPriority) {
    alert("Please select a priority before adding a task!");
    return;
  }

  const taskInput =
    document.getElementById("task-input") ||
    document.querySelector(".description");

  if (!taskInput) {
    console.error("Could not find task input element");
    alert("Error: Could not find task input field");
    return;
  }

  const taskDescription = taskInput.value ? taskInput.value.trim() : "";

  console.log("Task input element found:", !!taskInput);
  console.log("Task input value:", taskInput.value);
  console.log("Trimmed description:", taskDescription);
  console.log("Length:", taskDescription.length);

  if (!taskDescription || taskDescription === "") {
    console.log("Input is empty");
    alert("Task description cannot be empty!");
    return;
  }

  console.log("Input is valid, proceeding to add task");

  if (!task[currentProject]) {
    task[currentProject] = {};
  }

  const taskId = Date.now().toString();

  task[currentProject][taskId] = {
    id: taskId,
    description: taskDescription,
    priority: selectedPriority,
    completed: false,
    createdAt: new Date().toISOString(),
  };
  selectPriority("None");
  selectedPriority = "None";
  taskInput.value = "";

  // Save tasks to localStorage
  saveTasks();

  // Update the display
  displayTasks(currentProject);
}
