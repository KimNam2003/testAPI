const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs'); 
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;

// Middleware để phân tích dữ liệu JSON
app.use(bodyParser.json());

// Hàm đọc file JSON
const readDepartmentFile = () => {
  const data = fs.readFileSync('Department.json', 'utf-8'); 
  return JSON.parse(data || '[]');
};

// Hàm ghi file JSON
const writeDepartmentFile = (data) => {
  fs.writeFileSync('Department.json',JSON.stringify(data, null, 2))
  }

  const readEmployeeFile = () => {
    const data = fs.readFileSync('Employees.json', 'utf-8'); 
    return JSON.parse(data || '[]');
  };
  
  // Hàm ghi file JSON
const writeEmployeesFile = (data) => {
  fs.writeFileSync('Employees.json',JSON.stringify(data, null, 2))
  }


app.get('/departments', (req, res) => {
  const departments = readDepartmentFile();
  res.send(departments);
});

// Add a new department
app.post('/departments', (req, res) => {
  const { name, description, directorId} = req.body; // Lấy dữ liệu từ request body
  const departments = readDepartmentFile();
   const newDepartment = {
    Id: departments.length + 1,name, description, directorId 
  };

  // Thêm department mới vào danh sách và lưu lại
  departments.push(newDepartment);
  writeDepartmentFile(departments);
  res.send(newDepartment);

});
//Sửa phòng ban
app.put('/departments/:departmentId', (req, res) => {
  const id = parseInt(req.params.departmentId, 10); // Lấy ID từ URL
  const { name, description, directorId} = req.body; // Lấy dữ liệu mới từ request body
  const departments = readDepartmentFile(); // Đọc danh sách phòng ban hiện tại

  // Tìm chỉ số của phòng ban cần sửa
  const index = departments.findIndex(department => department.Id === id);
  if (index === -1) {
    // Nếu không tìm thấy phòng ban với ID tương ứng, trả về lỗi 404
    return res.status(404).send({ error: 'Department not found' });
  }
  departments[index] = { name, description, directorId} ;
  writeDepartmentFile(departments);
  res.send(departments[index]);
});
// API xóa phòng ban 
app.delete('/departments/:departmentId', (req, res) => {
  const departmentId = parseInt(req.params.departmentId, 10); // Đảm bảo rằng ID được chuyển đổi thành số nguyên
  const departments = readDepartmentFile(); // Đọc danh sách phòng ban hiện tại

  const index = departments.findIndex(department => department.Id === departmentId);

  if (index === -1) {
      return res.status(404).json({ message: 'Department not found' });
  }

  departments.splice(index, 1);
  writeDepartmentFile(departments);
  res.json({});
});

// ------------------------------------------------------------------------------------

// API lấy tất cả nhân viên
app.get('/employees', (req, res) => {
  const employees = readEmployeeFile();
  res.json(employees);
});

app.post('/employees', (req, res) => {
  const { name, age, departmentId, phone, email, salary } = req.body;
  const employees = readEmployeeFile();
  const departments = readDepartmentFile();

  // Kiểm tra phòng ban có tồn tại không
  const departmentExists = departments.some(department => department.Id === departmentId);
  if (!departmentExists) {
    return res.status(400).json({ message: 'Department not found' });
  }


  if (typeof salary !== 'number' || salary < 0 || typeof age !== 'number' || age <= 0) {
    return res.status(400).json({ message: 'Salary  và age k đúng định dạng ' });
  }

  // Lấy ID của nhân viên cuối cùng và tạo ID mới
  const lastEmployeeId = employees.length > 0 ? employees[employees.length - 1].employeeId : 0;
  const newEmployeeId = (lastEmployeeId === null || lastEmployeeId === undefined) ? 1 : lastEmployeeId + 1;

  const newEmployee = {
    employeeId: newEmployeeId,
    name,
    age,
    departmentId,
    phone,
    email,
    salary
  };

  employees.push(newEmployee);
  writeEmployeesFile(employees);
  res.status(201).json(newEmployee);
});

// API sửa thông tin nhân viên
app.put('/employees/:employeeId', (req, res) => {
  const employeeId = parseInt(req.params.employeeId, 10);
  const { name, age, departmentId, phone, email, salary } = req.body;
  const employees = readEmployeeFile();
  const departments = readDepartmentFile();

  const employeeIndex = employees.findIndex(employee => employee.employeeId === employeeId);
  if (employeeIndex === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  const departmentExists = departments.some(department => department.Id === departmentId);
  if (!departmentExists) {
    return res.status(400).json({ message: 'Department not found' });
  }

  // Cập nhật thông tin nhân viên
  employees[employeeIndex] = {employeeId,name,age,departmentId,phone,email,salary };
  writeEmployeesFile(employees);
  res.json(employees[employeeIndex]);
});

// API xóa thông tin nhân viên
app.delete('/employees/:employeeId', (req, res) => {
  const employeeId = parseInt(req.params.employeeId, 10);
  const employees = readEmployeeFile();
  const index = employees.findIndex(employee => employee.employeeId === employeeId);

  if (employeeId === -1) {
      return res.status(404).json({ message: 'Employee not found' });
  }

  employees.splice(index, 1);
  writeEmployeesFile( employees);
  res.json({});
});

// ------------------------------------------------------------------------

// Hàm tính mức lương trung bình của một phòng ban
const calculateAverageSalary = (departmentId, departments, employees) => {
  
  const department = departments.find(department => department.Id === departmentId);

  if (!department) {
    return null;
  }

  const departmentEmployees = employees.filter(employee => employee.departmentId === departmentId);

  if (departmentEmployees.length === 0) {
    return null;
  }

  const totalSalary = departmentEmployees.reduce((sum, employee) => sum + employee.salary, 0);
  const averageSalary = totalSalary / departmentEmployees.length;

  return averageSalary;
};

// API tính mức lương trung bình của một phòng ban
app.get('/departments/:departmentId/average-salary', (req, res) => {
  const departmentId = parseInt(req.params.departmentId, 10); // Lấy ID phòng ban từ URL
  const departments = readDepartmentFile(); // Đọc danh sách phòng ban từ file
  const employees = readEmployeeFile(); // Đọc danh sách nhân viên từ file

  const averageSalary = calculateAverageSalary(departmentId, departments, employees);

  if (averageSalary === null) {
    return res.status(404).json({ message: 'Department not found or no employees in this department' });
  }

  res.json({ departmentId, averageSalary });
});

// ----------------------------------------------------------------------------------------

// API tìm phòng ban có mức lương trung bình cao nhất
app.get('/departments/highest-average-salary', (req, res) => {
  const departments = readDepartmentFile(); 
  const employees = readEmployeeFile(); 

  let highestAvgSalary = 0;
  let highestDepartment = null;

  // Duyệt qua tất cả các phòng ban
  departments.forEach(department => {
    const averageSalary = calculateAverageSalary(department.Id, departments, employees);

    if (averageSalary !== null && averageSalary > highestAvgSalary) {
      highestAvgSalary = averageSalary;
      highestDepartment = department;
    }
  });

  if (highestDepartment) {
    res.json({ department: highestDepartment, averageSalary: highestAvgSalary });
  } else {
    res.status(404).json({ message: 'No departments found' });
  }
});

//----------------------------------------------------------------------------------------------

// API tìm nhân viên có mức lương cao nhất trong phòng ban
app.get('/departments/:departmentId/highest-salary-employee', (req, res) => {
  const departmentId = parseInt(req.params.departmentId, 10);
  const departments = readDepartmentFile(); 
  const employees = readEmployeeFile(); 

  // Tìm phòng ban với ID được truyền lên
  const targetDepartment = departments.find(department => department.Id === departmentId);

  if (!targetDepartment) {
    return res.status(404).json({ message: 'Department not found' });
  }

  const departmentEmployees = employees.filter(employee => employee.departmentId === departmentId);
  if (departmentEmployees.length === 0) {
    return res.status(404).json({ message: 'No employees found in this department' });
  }
  
  let highestSalaryEmployee = departmentEmployees[0];
  departmentEmployees.forEach(employee => {
    if (employee.salary > highestSalaryEmployee.salary) {
      highestSalaryEmployee = employee;
    }
  });

  res.json(highestSalaryEmployee);
});

//-----------------------------------------------------------------------

// API trả về danh sách các trưởng phòng
app.get('/departments/directors', (req, res) => {
  const departments = readDepartmentFile(); 
  const employees = readEmployeeFile(); 

  const directors = departments.map(department => {
    const director = employees.find(employee => employee.employeeId === department.directorId);
    return {
      departmentId: department.Id,
      departmentName: department.name,
      director: director ? {
        employeeId: director.employeeId,
        name: director.name,
        age: director.age,
        phone: director.phone,
        email: director.email,
        salary: director.salary
      } : null
    };
  }).filter(department => department.director !== null); 

  res.json(directors);
});





// Start server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
