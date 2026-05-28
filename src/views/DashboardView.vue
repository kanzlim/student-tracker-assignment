<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const currentUser = ref({})
const students = ref([])
const assignments = ref([])
const announcements = ref([])
const submissions = ref([])
const instructorAccounts = ref([])
const showLogoutModal = ref(false)

onMounted(async () => {
  const savedUser = JSON.parse(localStorage.getItem('currentUser'))

  if (!savedUser) {
    router.push('/')
    return
  }

  currentUser.value = savedUser

  await loadDashboardData()
})

const loadDashboardData = async () => {
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')

  const { data: assignmentsData } = await supabase
    .from('assignments')
    .select('*')

  const { data: announcementsData } = await supabase
    .from('announcements')
    .select('*')

  const { data: submissionsData } = await supabase
    .from('submissions')
    .select('*')

  students.value = profilesData?.filter(profile => profile.role === 'student') || []

  instructorAccounts.value = profilesData?.filter(
    profile =>
      profile.role === 'instructor' ||
      profile.role === 'admin'
  ) || []

  assignments.value = assignmentsData || []
  announcements.value = announcementsData || []
  submissions.value = submissionsData || []
}

const totalStudents = computed(() => students.value.length)

const totalAssignments = computed(() => assignments.value.length)

const totalAnnouncements = computed(() => announcements.value.length)

const totalSubmissions = computed(() => submissions.value.length)

const totalInstructors = computed(() =>
  instructorAccounts.value.filter(account => account.role === 'instructor').length
)

const totalAdmins = computed(() =>
  instructorAccounts.value.filter(account => account.role === 'admin').length
)

const openLogoutModal = () => {
  showLogoutModal.value = true
}

const cancelLogout = () => {
  showLogoutModal.value = false
}

const confirmLogout = () => {
  localStorage.removeItem('currentUser')
  showLogoutModal.value = false
  router.push('/')
}
</script>

<template>
  <main class="page">
    <aside class="sidebar">
      <h1>Student Tracker</h1>

      <nav class="menu">
        <router-link to="/dashboard" class="nav active">
          Dashboard
        </router-link>

        <router-link to="/students" class="nav">
          Students
        </router-link>

        <router-link to="/assignments" class="nav">
          Assignments
        </router-link>

        <router-link to="/announcements" class="nav">
          Announcements
        </router-link>

        <router-link to="/settings" class="nav">
          Settings
        </router-link>
      </nav>

      <button class="logout-btn" @click="openLogoutModal">
        Logout
      </button>
    </aside>

    <div
      v-if="showLogoutModal"
      class="modal-overlay"
    >
      <div class="logout-modal">
        <div class="modal-icon">
          🚪
        </div>

        <h2>
          Logout Confirmation
        </h2>

        <p>
          Are you sure you want to logout?
        </p>

        <div class="modal-actions">
          <button
            class="cancel-logout"
            @click="cancelLogout"
          >
            Cancel
          </button>

          <button
            class="confirm-logout"
            @click="confirmLogout"
          >
            Yes, Logout
          </button>
        </div>
      </div>
    </div>

    <section class="content">
      <div class="topbar">
        <div>
          <h2>Dashboard</h2>

          <p>
            Welcome back,
            {{ currentUser.fullName || currentUser.full_name || 'User' }}
          </p>
        </div>

        <div class="profile">
          👤
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="icon">🎓</div>

          <div>
            <span>Students</span>
            <h3>{{ totalStudents }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon purple">📄</div>

          <div>
            <span>Assignments</span>
            <h3>{{ totalAssignments }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon green">📝</div>

          <div>
            <span>Submissions</span>
            <h3>{{ totalSubmissions }}</h3>
          </div>
        </div>

        <div class="card">
          <div class="icon orange">📢</div>

          <div>
            <span>Announcements</span>
            <h3>{{ totalAnnouncements }}</h3>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="panel">
          <h3>System Overview</h3>

          <div class="info-row">
            <span>Total Students</span>
            <strong>{{ totalStudents }}</strong>
          </div>

          <div class="info-row">
            <span>Total Assignments</span>
            <strong>{{ totalAssignments }}</strong>
          </div>

          <div class="info-row">
            <span>Total Submissions</span>
            <strong>{{ totalSubmissions }}</strong>
          </div>

          <div class="info-row">
            <span>Total Announcements</span>
            <strong>{{ totalAnnouncements }}</strong>
          </div>

          <div class="info-row">
            <span>Total Instructors</span>
            <strong>{{ totalInstructors }}</strong>
          </div>

          <div class="info-row">
            <span>Total Admins</span>
            <strong>{{ totalAdmins }}</strong>
          </div>
        </div>

        <div class="panel">
          <h3>Dashboard Info</h3>

          <div class="message">
            The dashboard automatically updates based on the data saved in Supabase.
          </div>

          <div class="message">
            Students are counted from the profiles table where role is student.
          </div>

          <div class="message">
            Assignments, submissions, and announcements are loaded from their Supabase tables.
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

.modal-overlay{
  position:fixed;
  inset:0;
  background:rgba(15,23,42,0.55);
  display:flex;
  justify-content:center;
  align-items:center;
  z-index:10000;
  padding:20px;
}

.logout-modal{
  width:100%;
  max-width:420px;
  background:white;
  border-radius:22px;
  padding:28px;
  text-align:center;
  box-shadow:0 25px 50px rgba(0,0,0,0.25);
  animation:popIn .25s ease;
}

.modal-icon{
  width:64px;
  height:64px;
  border-radius:50%;
  background:#fee2e2;
  color:#b91c1c;
  display:grid;
  place-items:center;
  font-size:30px;
  margin:0 auto 14px;
}

.logout-modal h2{
  font-size:24px;
  font-weight:900;
  color:#020817;
  margin-bottom:8px;
}

.logout-modal p{
  color:#64748b;
  font-size:15px;
  margin-bottom:22px;
}

.modal-actions{
  display:flex;
  gap:12px;
}

.cancel-logout,
.confirm-logout{
  flex:1;
  height:46px;
  border:none;
  border-radius:12px;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
}

.cancel-logout{
  background:#e2e8f0;
  color:#020817;
}

.confirm-logout{
  background:#ef4444;
  color:white;
}

@keyframes popIn{
  from{
    opacity:0;
    transform:scale(0.94);
  }

  to{
    opacity:1;
    transform:scale(1);
  }
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

  .modal-actions{
    flex-direction:column;
  }
}
</style>