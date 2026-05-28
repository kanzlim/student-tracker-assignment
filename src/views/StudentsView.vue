<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const students = ref([])
const searchId = ref('')
const editingId = ref(null)

const selectedCourse = ref('All')
const selectedYear = ref('All')

const form = ref({
  studentId: '',
  fullName: '',
  email: '',
  course: '',
  yearLevel: '',
  status: 'Enrolled'
})

onMounted(() => {
  students.value =
    JSON.parse(localStorage.getItem('students')) || []
})

const totalStudents = computed(() =>
  students.value.length
)

const enrolledStudents = computed(() =>
  students.value.filter(
    student => student.status === 'Enrolled'
  ).length
)

const filteredStudents = computed(() => {
  return students.value.filter(student => {
    const matchCourse =
      selectedCourse.value === 'All' ||
      student.course === selectedCourse.value

    const matchYear =
      selectedYear.value === 'All' ||
      student.yearLevel === selectedYear.value

    return matchCourse && matchYear
  })
})

const saveStudents = () => {
  localStorage.setItem(
    'students',
    JSON.stringify(students.value)
  )
}

const resetForm = () => {
  form.value = {
    studentId: '',
    fullName: '',
    email: '',
    course: '',
    yearLevel: '',
    status: 'Enrolled'
  }

  editingId.value = null
}

const addStudent = () => {
  if (
    !form.value.fullName ||
    !form.value.email ||
    !form.value.course ||
    !form.value.yearLevel
  ) {
    alert('Please fill in all information.')
    return
  }

  if (editingId.value) {
    const index = students.value.findIndex(
      student => student.studentId === editingId.value
    )

    if (index !== -1) {
      students.value[index] = {
        studentId: editingId.value,
        fullName: form.value.fullName,
        name: form.value.fullName,
        email: form.value.email,
        course: form.value.course,
        yearLevel: form.value.yearLevel,
        status: form.value.status
      }
    }

    editingId.value = null
  } else {
    students.value.push({
      studentId: `STU-${Math.floor(
        100000 + Math.random() * 900000
      )}`,
      fullName: form.value.fullName,
      name: form.value.fullName,
      email: form.value.email,
      course: form.value.course,
      yearLevel: form.value.yearLevel,
      status: form.value.status
    })
  }

  saveStudents()
  resetForm()

  alert('Student saved successfully.')
}

const editStudent = (student) => {
  editingId.value = student.studentId

  form.value = {
    studentId: student.studentId,
    fullName: student.fullName || student.name,
    email: student.email,
    course: student.course,
    yearLevel: student.yearLevel,
    status: student.status
  }
}

const deleteStudent = (studentId) => {
  if (confirm('Delete this student permanently?')) {
    students.value = students.value.filter(
      student => student.studentId !== studentId
    )

    const studentAccounts =
      JSON.parse(localStorage.getItem('studentAccounts')) || []

    const updatedAccounts = studentAccounts.filter(
      account => account.id !== studentId
    )

    const submissions =
      JSON.parse(localStorage.getItem('submissions')) || []

    const updatedSubmissions = submissions.filter(
      submission => submission.studentId !== studentId
    )

    localStorage.setItem('students', JSON.stringify(students.value))
    localStorage.setItem('studentAccounts', JSON.stringify(updatedAccounts))
    localStorage.setItem('submissions', JSON.stringify(updatedSubmissions))

    alert('Student account permanently deleted.')
  }
}

const searchStudent = () => {
  if (!searchId.value.trim()) {
    alert('Please enter a Student ID.')
    return
  }

  const found = students.value.find(
    student =>
      student.studentId.toLowerCase() ===
      searchId.value.trim().toLowerCase()
  )

  if (!found) {
    alert('Student ID not found.')
    return
  }

  alert(
`Student Found:

Name: ${found.fullName || found.name}

Email: ${found.email}

Course: ${found.course}

Year: ${found.yearLevel}`
  )
}

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/')
}
</script>

<template>
  <main class="page">
    <aside class="sidebar">
      <h1>Student Tracker</h1>

      <nav class="menu">
        <router-link
          to="/dashboard"
          class="nav"
        >
          Dashboard
        </router-link>

        <router-link
          to="/students"
          class="nav active"
        >
          Students
        </router-link>

        <router-link
          to="/assignments"
          class="nav"
        >
          Assignments
        </router-link>

        <router-link
          to="/announcements"
          class="nav"
        >
          Announcements
        </router-link>

        <router-link
          to="/settings"
          class="nav"
        >
          Settings
        </router-link>
      </nav>

      <button
        class="logout-btn"
        @click="logout"
      >
        Logout
      </button>
    </aside>

    <section class="content">
      <div class="topbar">
        <div>
          <h2>Students</h2>

          <p>
            Manage enrolled students by
            course and year level.
          </p>
        </div>

        <div class="profile">
          👤
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="icon">
            🎓
          </div>

          <div>
            <span>Total Students</span>

            <h3>
              {{ totalStudents }}
            </h3>
          </div>
        </div>

        <div class="card">
          <div class="icon green">
            ✅
          </div>

          <div>
            <span>Enrolled Students</span>

            <h3>
              {{ enrolledStudents }}
            </h3>
          </div>
        </div>
      </div>

      <div class="search-box">
        <input
          v-model="searchId"
          type="text"
          placeholder="Enter Student ID"
        />

        <button @click="searchStudent">
          Search
        </button>
      </div>

      <div class="filters">
        <select v-model="selectedCourse">
          <option>All</option>
          <option>BSIT</option>
          <option>BSIS</option>
          <option>BSCS</option>
        </select>

        <select v-model="selectedYear">
          <option>All</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
      </div>

      <div class="main-grid">
        <div class="panel">
          <h3>
            {{
              editingId
                ? 'Edit Student'
                : 'Add Student'
            }}
          </h3>

          <label>
            Student ID
          </label>

          <input
            type="text"
            :value="
              form.studentId ||
              'Auto Generated'
            "
            disabled
          />

          <label>
            Full Name
          </label>

          <input
            v-model="form.fullName"
            type="text"
            placeholder="Student name"
          />

          <label>
            Email
          </label>

          <input
            v-model="form.email"
            type="email"
            placeholder="Email"
          />

          <label>
            Course
          </label>

          <select v-model="form.course">
            <option value="">
              Select Course
            </option>

            <option>
              BSIT
            </option>

            <option>
              BSIS
            </option>

            <option>
              BSCS
            </option>
          </select>

          <label>
            Year Level
          </label>

          <select v-model="form.yearLevel">
            <option value="">
              Select Year
            </option>

            <option>
              1st Year
            </option>

            <option>
              2nd Year
            </option>

            <option>
              3rd Year
            </option>

            <option>
              4th Year
            </option>
          </select>

          <label>
            Status
          </label>

          <select v-model="form.status">
            <option>
              Enrolled
            </option>

            <option>
              Inactive
            </option>
          </select>

          <button
            class="save-btn"
            @click="addStudent"
          >
            {{
              editingId
                ? 'Update Student'
                : 'Save Student'
            }}
          </button>

          <button
            v-if="editingId"
            class="cancel-btn"
            @click="resetForm"
          >
            Cancel Edit
          </button>
        </div>

        <div class="panel">
          <h3>
            Student List
          </h3>

          <div
            v-if="filteredStudents.length === 0"
            class="empty"
          >
            <div>
              <div class="empty-icon">
                📚
              </div>

              <h2>
                No students found
              </h2>

              <p>
                No enrolled students match
                the selected filter.
              </p>
            </div>
          </div>

          <div
            v-else
            class="student-list"
          >
            <div
              v-for="student in filteredStudents"
              :key="student.studentId"
              class="student-item"
            >
              <div class="student-info">
                <h4>
                  {{
                    student.fullName ||
                    student.name
                  }}
                </h4>

                <p>
                  {{ student.course }}
                  •
                  {{ student.yearLevel }}
                </p>

                <small class="student-email">
                  {{ student.email }}
                </small>

                <small class="student-id">
                  {{ student.studentId }}
                </small>
              </div>

              <div class="actions">
                <span
                  class="badge"
                  :class="{
                    inactive:
                      student.status === 'Inactive'
                  }"
                >
                  {{ student.status }}
                </span>

                <button
                  class="edit"
                  @click="editStudent(student)"
                >
                  Edit
                </button>

                <button
                  class="delete"
                  @click="deleteStudent(student.studentId)"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:Arial,sans-serif;
}

.page{
  width:100%;
  min-height:100vh;
  display:flex;
  background:#eef2f7;
}

.sidebar{
  width:250px;
  min-height:100vh;
  background:#020817;
  color:white;
  padding:20px 16px;
  display:flex;
  flex-direction:column;
  flex-shrink:0;
}

.sidebar h1{
  font-size:20px;
  font-weight:900;
  margin-bottom:34px;
}

.menu{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.nav{
  width:100%;
  height:48px;
  border-radius:14px;
  text-decoration:none;
  color:white;
  display:flex;
  align-items:center;
  padding:0 16px;
  font-size:15px;
  font-weight:700;
}

.nav.active{
  background:#2563eb;
}

.logout-btn{
  width:100%;
  height:48px;
  border:none;
  border-radius:14px;
  background:#ef4444;
  color:white;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
  margin-top:auto;
}

.content{
  flex:1;
  height:100vh;
  padding:16px 24px 24px;
  overflow-y:auto;
}

.topbar{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  margin-bottom:18px;
}

.topbar h2{
  font-size:34px;
  font-weight:900;
  color:#020817;
}

.topbar p{
  color:#64748b;
  margin-top:8px;
  font-size:15px;
}

.profile{
  width:56px;
  height:56px;
  border-radius:50%;
  background:white;
  display:grid;
  place-items:center;
  font-size:24px;
}

.cards{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:16px;
  margin-bottom:18px;
}

.card{
  background:white;
  border-radius:18px;
  padding:20px;
  display:flex;
  align-items:center;
  gap:16px;
}

.icon{
  width:56px;
  height:56px;
  border-radius:16px;
  background:#dbeafe;
  display:grid;
  place-items:center;
  font-size:24px;
}

.green{
  background:#dcfce7;
}

.card span{
  color:#64748b;
  font-size:15px;
  font-weight:700;
}

.card h3{
  margin-top:6px;
  font-size:24px;
  font-weight:900;
  color:#020817;
}

.search-box{
  display:flex;
  gap:14px;
  margin-bottom:18px;
}

.search-box input{
  flex:1;
  height:48px;
  border:1px solid #cbd5e1;
  border-radius:14px;
  padding:0 16px;
  font-size:15px;
  background:white;
}

.search-box button{
  width:135px;
  height:48px;
  border:none;
  border-radius:14px;
  background:#2563eb;
  color:white;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
}

.filters{
  display:flex;
  gap:12px;
  margin-bottom:18px;
}

.filters select{
  width:220px;
  height:46px;
  border:1px solid #cbd5e1;
  border-radius:12px;
  padding:0 12px;
  background:white;
  font-size:14px;
}

.main-grid{
  display:grid;
  grid-template-columns:360px 1fr;
  gap:16px;
  align-items:start;
}

.panel{
  background:white;
  border-radius:18px;
  padding:22px;
}

.panel h3{
  margin-bottom:18px;
  font-size:22px;
  font-weight:900;
  color:#020817;
}

label{
  display:block;
  margin-bottom:6px;
  font-size:14px;
  font-weight:800;
  color:#020817;
}

input,
select{
  width:100%;
  height:44px;
  border:1px solid #cbd5e1;
  border-radius:12px;
  padding:0 12px;
  font-size:14px;
  margin-bottom:12px;
  background:white;
}

.save-btn,
.cancel-btn{
  width:100%;
  height:46px;
  border:none;
  border-radius:12px;
  color:white;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
}

.save-btn{
  background:#2563eb;
}

.cancel-btn{
  background:#64748b;
  margin-top:10px;
}

.student-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.student-item{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

.student-info{
  display:flex;
  flex-direction:column;
}

.student-item h4{
  font-size:17px;
  color:#020817;
}

.student-item p{
  color:#64748b;
  font-size:14px;
  margin-top:4px;
}

.student-email{
  display:block;
  font-size:13px;
  color:#64748b;
  margin-top:4px;
}

.student-id{
  display:block;
  font-size:13px;
  color:#0f172a;
  margin-top:2px;
  font-weight:700;
}

.actions{
  display:flex;
  align-items:center;
  gap:8px;
}

.badge{
  padding:8px 12px;
  border-radius:999px;
  background:#dcfce7;
  color:#166534;
  font-size:12px;
  font-weight:800;
}

.badge.inactive{
  background:#fee2e2;
  color:#991b1b;
}

.edit{
  border:none;
  border-radius:10px;
  padding:9px 12px;
  background:#fef3c7;
  color:#92400e;
  font-weight:800;
  cursor:pointer;
}

.delete{
  border:none;
  border-radius:10px;
  padding:9px 12px;
  background:#fee2e2;
  color:#b91c1c;
  font-weight:800;
  cursor:pointer;
}

.empty{
  min-height:240px;
  border:1px dashed #cbd5e1;
  border-radius:14px;
  background:#f8fafc;
  display:grid;
  place-items:center;
  text-align:center;
  padding:20px;
}

.empty-icon{
  font-size:42px;
  margin-bottom:8px;
}

@media(max-width:1100px){
  .main-grid{
    grid-template-columns:1fr;
  }

  .cards{
    grid-template-columns:1fr;
  }
}

@media(max-width:800px){
  .page{
    flex-direction:column;
  }

  .sidebar{
    width:100%;
    min-height:auto;
  }

  .content{
    height:auto;
    padding:16px;
  }

  .topbar{
    flex-direction:column;
    gap:14px;
  }

  .search-box,
  .filters{
    flex-direction:column;
  }

  .search-box button,
  .filters select{
    width:100%;
  }

  .student-item{
    flex-direction:column;
    align-items:flex-start;
  }
}
</style>