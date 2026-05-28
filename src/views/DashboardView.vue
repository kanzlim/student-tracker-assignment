<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentUser = ref({})

const students = ref([])
const assignments = ref([])
const announcements = ref([])
const instructorAccounts = ref([])

onMounted(() => {
  const savedUser =
    JSON.parse(localStorage.getItem('currentUser'))

  if (!savedUser) {
    router.push('/')
    return
  }

  currentUser.value = savedUser

  students.value =
    JSON.parse(localStorage.getItem('students')) || []

  assignments.value =
    JSON.parse(localStorage.getItem('assignments')) || []

  announcements.value =
    JSON.parse(localStorage.getItem('announcements')) || []

  instructorAccounts.value =
    JSON.parse(localStorage.getItem('instructorAccounts')) || []
})

const totalStudents = computed(() =>
  students.value.length
)

const totalAssignments = computed(() =>
  assignments.value.length
)

const totalAnnouncements = computed(() =>
  announcements.value.length
)

const totalEnrollments = computed(() =>
  students.value.filter(
    student => student.status === 'Enrolled'
  ).length
)

const totalInstructors = computed(() =>
  instructorAccounts.value.filter(
    account =>
      account.role === 'instructor'
  ).length
)

const totalAdmins = computed(() =>
  instructorAccounts.value.filter(
    account =>
      account.role === 'admin'
  ).length
)

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
          class="nav active"
        >
          Dashboard
        </router-link>

        <router-link
          to="/students"
          class="nav"
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
          <h2>Dashboard</h2>

          <p>
            Welcome back,
            {{ currentUser.fullName }}
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
            <span>Students</span>

            <h3>
              {{ totalStudents }}
            </h3>
          </div>
        </div>

        <div class="card">
          <div class="icon purple">
            📄
          </div>

          <div>
            <span>Assignments</span>

            <h3>
              {{ totalAssignments }}
            </h3>
          </div>
        </div>

        <div class="card">
          <div class="icon green">
            📝
          </div>

          <div>
            <span>Enrollments</span>

            <h3>
              {{ totalEnrollments }}
            </h3>
          </div>
        </div>

        <div class="card">
          <div class="icon orange">
            📢
          </div>

          <div>
            <span>Announcements</span>

            <h3>
              {{ totalAnnouncements }}
            </h3>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="panel">
          <h3>System Overview</h3>

          <div class="info-row">
            <span>Total Students</span>

            <strong>
              {{ totalStudents }}
            </strong>
          </div>

          <div class="info-row">
            <span>Total Assignments</span>

            <strong>
              {{ totalAssignments }}
            </strong>
          </div>

          <div class="info-row">
            <span>Total Enrollments</span>

            <strong>
              {{ totalEnrollments }}
            </strong>
          </div>

          <div class="info-row">
            <span>Total Announcements</span>

            <strong>
              {{ totalAnnouncements }}
            </strong>
          </div>

          <div class="info-row">
            <span>Total Instructors</span>

            <strong>
              {{ totalInstructors }}
            </strong>
          </div>

          <div class="info-row">
            <span>Total Admins</span>

            <strong>
              {{ totalAdmins }}
            </strong>
          </div>
        </div>

        <div class="panel">
          <h3>Dashboard Info</h3>

          <div class="message">
            The dashboard automatically updates based on the students,
            assignments, enrollments, and announcements you create.
          </div>

          <div class="message">
            Announcements can now be posted by course and year level,
            then shown only to matching students.
          </div>
          
          <div class="message">
            All data is currently saved using localStorage. Later,
            this can connect to Supabase or Laravel backend database.
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

.nav:hover{
  background:#1e293b;
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
  flex-shrink:0;
}

.cards{
  display:grid;
  grid-template-columns:repeat(4,1fr);
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
  flex-shrink:0;
}

.purple{
  background:#ede9fe;
}

.green{
  background:#dcfce7;
}

.orange{
  background:#ffedd5;
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

.main-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:16px;
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

.info-row,
.message{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  margin-bottom:12px;
}

.info-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

.info-row span{
  color:#64748b;
  font-size:14px;
  font-weight:700;
}

.info-row strong{
  color:#020817;
  font-size:15px;
  font-weight:800;
}

.message{
  color:#334155;
  line-height:1.6;
  font-size:15px;
}

@media(max-width:1100px){
  .cards{
    grid-template-columns:1fr 1fr;
  }

  .main-grid{
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

  .cards{
    grid-template-columns:1fr;
  }
}
</style>