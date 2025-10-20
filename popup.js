document.addEventListener('DOMContentLoaded', () => {
  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskDateTime = document.getElementById('taskDateTime');
  const taskList = document.getElementById('taskList');

  // Hàm tải và hiển thị công việc
  const loadTasks = () => {
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      
      // === PHẦN SẮP XẾP ĐÃ CẬP NHẬT ===
      tasks.sort((a, b) => {
        // 1. Ưu tiên công việc chưa hoàn thành (false) lên trước
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Nếu a.completed là true, nó sẽ đi xuống (1)
        }
        
        // 2. Nếu cả hai đều chưa hoàn thành (hoặc đều đã hoàn thành),
        // thì sắp xếp theo ngày giờ
        return new Date(a.dateTime) - new Date(b.dateTime);
      });

      displayTasks(tasks);
    });
  };

  // Hàm hiển thị công việc lên giao diện
  const displayTasks = (tasks) => {
    taskList.innerHTML = ''; // Xóa danh sách cũ
    if (tasks.length === 0) {
      taskList.innerHTML = '<li style="color: #888; justify-content: center;">Không có công việc nào.</li>';
      return;
    }

    tasks.forEach((task) => {
      const li = document.createElement('li');
      // Thêm class 'completed' nếu task đã hoàn thành
      li.className = task.completed ? 'completed' : '';
      
      // Định dạng lại ngày giờ cho dễ đọc (theo kiểu Việt Nam)
      const formattedDate = new Date(task.dateTime).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      li.innerHTML = `
        <div class="task-container">
          <input type="checkbox" class="task-check" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
          <div class="task-content">
            <span class="task-text">${task.text}</span>
            <span class="task-time">${formattedDate}</span>
          </div>
        </div>
        <button class="delete-btn" data-id="${task.id}">Xóa</button>
      `;

      // Thêm sự kiện cho nút xóa
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        const taskId = Number(e.target.getAttribute('data-id'));
        deleteTask(taskId);
      });

      // Thêm sự kiện cho checkbox
      li.querySelector('.task-check').addEventListener('change', (e) => {
        const taskId = Number(e.target.getAttribute('data-id'));
        toggleTaskComplete(taskId);
      });

      taskList.appendChild(li);
    });
  };

  // Hàm lưu danh sách công việc
  const saveTasks = (tasks) => {
    chrome.storage.local.set({ tasks: tasks }, () => {
      loadTasks(); // Tải lại (để sắp xếp và hiển thị)
    });
  };

  // Hàm thêm công việc mới
  const addTask = (text, dateTime) => {
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      const newTask = {
        id: Date.now(),
        text: text,
        dateTime: dateTime,
        completed: false // Trạng thái mặc định là chưa hoàn thành
      };
      tasks.push(newTask);
      saveTasks(tasks);
    });
  };

  // Hàm xóa công việc
  const deleteTask = (id) => {
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      const updatedTasks = tasks.filter(task => task.id !== id);
      saveTasks(updatedTasks);
    });
  };
  
  // Hàm (MỚI) để thay đổi trạng thái hoàn thành
  const toggleTaskComplete = (id) => {
    chrome.storage.local.get(['tasks'], (result) => {
      let tasks = result.tasks || [];
      const updatedTasks = tasks.map(task => {
        if (task.id === id) {
          return { ...task, completed: !task.completed }; // Đảo ngược trạng thái
        }
        return task;
      });
      saveTasks(updatedTasks);
    });
  };

  // Xử lý sự kiện khi gửi form
  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    const dateTime = taskDateTime.value;
    if (text === '' || dateTime === '') return; // Không cần alert

    addTask(text, dateTime);
    taskInput.value = '';
    taskDateTime.value = '';
  });

  // Tải công việc ngay khi mở popup
  loadTasks();
});