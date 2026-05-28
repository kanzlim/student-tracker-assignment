<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const currentUser = ref({})
const instructorAccounts = ref([])
const editingInstructorId = ref(null)

const showPassword = ref(false)
const showInstructorPassword = ref(false)
const showLogoutModal = ref(false)

const profile = ref({
  fullName: '',
  email: '',
  role: '',
  password: ''
})

const instructorForm = ref({
  id: '',
  fullName: '',
  email: '',
  password: '',
  role: 'instructor'
})

const normalizeAccount = (account) => {
  return {
    id: account.id,
    fullName: account.full_name || account.fullName || '',
    email: account.email || '',
    password: account.password || '',
    role: account.role || 'instructor',
    course: account.course || '',
    yearLevel: account.year_level || account.yearLevel || ''
  }
}

const loadAccounts = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['admin', 'instructor'])
    .order('created_at', { ascending: true })

  if (error) {
    alert('Failed to load accounts.')
    console.log(error)
    return
  }

  instructorAccounts.value = data.map(normalizeAccount)
}

onMounted(async () => {
  const savedUser = JSON.parse(localStorage.getItem('currentUser'))

  if (!savedUser) {
    router.push('/')
    return
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', savedUser.email)
    .maybeSingle()

  if (error || !data) {
    currentUser.value = savedUser
  } else {
    currentUser.value = normalizeAccount(data)

    localStorage.setItem(
      'currentUser',
      JSON.stringify(currentUser.value)
    )
  }

  profile.value = {
    fullName: currentUser.value.fullName,
    email: currentUser.value.email,
    role: currentUser.value.role,
    password: ''
  }

  await loadAccounts()
})

const isAdmin = computed(() => currentUser.value.role === 'admin')

const saveSettings = async () => {
  if (!profile.value.fullName || !profile.value.email || !profile.value.role) {
    alert('Please fill in all account information.')
    return
  }

  const updatedAccount = {
    full_name: profile.value.fullName,
    email: profile.value.email,
    role: isAdmin.value ? profile.value.role : currentUser.value.role,
    password: profile.value.password || currentUser.value.password
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatedAccount)
    .eq('id', currentUser.value.id)

  if (error) {
    alert('Failed to save settings.')
    console.log(error)
    return
  }

  currentUser.value = {
    ...currentUser.value,
    fullName: profile.value.fullName,
    email: profile.value.email,
    role: updatedAccount.role,
    password: updatedAccount.password
  }

  localStorage.setItem(
    'currentUser',
    JSON.stringify(currentUser.value)
  )

  profile.value.password = ''

  await loadAccounts()

  alert('Settings saved successfully.')
}

const resetSettings = () => {
  profile.value = {
    fullName: currentUser.value.fullName,
    email: currentUser.value.email,
    role: currentUser.value.role,
    password: ''
  }
}

const resetInstructorForm = () => {
  instructorForm.value = {
    id: '',
    fullName: '',
    email: '',
    password: '',
    role: 'instructor'
  }

  editingInstructorId.value = null
}

const saveInstructor = async () => {
  if (!isAdmin.value) {
    alert('Only admin can manage accounts.')
    return
  }

  if (
    !instructorForm.value.fullName ||
    !instructorForm.value.email ||
    !instructorForm.value.password ||
    !instructorForm.value.role
  ) {
    alert('Please fill in all account details.')
    return
  }

  const cleanEmail = instructorForm.value.email.trim().toLowerCase()

  const { data: duplicate } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (
    duplicate &&
    duplicate.id !== editingInstructorId.value
  ) {
    alert('Email already exists.')
    return
  }

  if (editingInstructorId.value) {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: instructorForm.value.fullName,
        email: cleanEmail,
        password: instructorForm.value.password,
        role: instructorForm.value.role
      })
      .eq('id', editingInstructorId.value)

    if (error) {
      alert('Failed to update account.')
      console.log(error)
      return
    }
  } else {
    const { error } = await supabase
      .from('profiles')
      .insert([
        {
          full_name: instructorForm.value.fullName,
          email: cleanEmail,
          password: instructorForm.value.password,
          role: instructorForm.value.role,
          course: null,
          year_level: null
        }
      ])

    if (error) {
      alert('Failed to create account.')
      console.log(error)
      return
    }
  }

  await loadAccounts()
  resetInstructorForm()

  alert('Account saved successfully.')
}

const editInstructor = (account) => {
  if (!isAdmin.value) {
    alert('Only admin can edit roles.')
    return
  }

  editingInstructorId.value = account.id

  instructorForm.value = {
    id: account.id,
    fullName: account.fullName,
    email: account.email,
    password: account.password,
    role: account.role
  }
}

const deleteInstructor = async (id) => {
  if (!isAdmin.value) {
    alert('Only admin can delete accounts.')
    return
  }

  if (id === currentUser.value.id) {
    alert('You cannot delete your own account.')
    return
  }

  if (confirm('Delete this account permanently?')) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Failed to delete account. Please add delete policy in Supabase.')
      console.log(error)
      return
    }

    await loadAccounts()

    alert('Account deleted successfully.')
  }
}

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
        <router-link to="/dashboard" class="nav">Dashboard</router-link>
        <router-link to="/students" class="nav">Students</router-link>
        <router-link to="/assignments" class="nav">Assignments</router-link>
        <router-link to="/announcements" class="nav">Announcements</router-link>
        <router-link to="/settings" class="nav active">Settings</router-link>
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
          <h2>Settings</h2>
          <p>Manage your account and admin/instructor accounts.</p>
        </div>

        <div class="profile">👤</div>
      </div>

      <div class="main-grid">
        <div class="panel">
          <h3>Account Settings</h3>

          <label>Full Name</label>
          <input v-model="profile.fullName" type="text" />

          <label>Email</label>
          <input v-model="profile.email" type="email" />

          <label>Role</label>
          <select v-if="isAdmin" v-model="profile.role">
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
          </select>

          <input v-else v-model="profile.role" type="text" disabled />

          <label>Change Password</label>
          <div class="password-box">
            <input
              v-model="profile.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter new password"
            />

            <button
              type="button"
              class="eye-btn"
              @click="showPassword = !showPassword"
            >
              <svg
                v-if="showPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>

              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-2.16 3.19"/>
                <path d="M6.61 6.61A18.7 18.7 0 0 0 2 12s3.5 7 10 7a10.43 10.43 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>

          <button class="save-btn" @click="saveSettings">
            Save Settings
          </button>

          <button class="reset-btn" @click="resetSettings">
            Reset
          </button>
        </div>

        <div class="panel">
          <h3>Account Preview</h3>

          <div class="preview-card">
            <div class="preview-avatar">👤</div>

            <h2>{{ profile.fullName }}</h2>
            <p>{{ profile.email }}</p>

            <span class="role-badge">
              {{ profile.role }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="isAdmin" class="admin-grid">
        <div class="panel">
          <h3>
            {{ editingInstructorId ? 'Edit Account' : 'Create Instructor/Admin Account' }}
          </h3>

          <label>Account ID</label>
          <input
            v-model="instructorForm.id"
            type="text"
            placeholder="Auto Generated by Supabase"
            disabled
          />

          <label>Full Name</label>
          <input
            v-model="instructorForm.fullName"
            type="text"
            placeholder="Enter full name"
          />

          <label>Email</label>
          <input
            v-model="instructorForm.email"
            type="email"
            placeholder="Enter email"
          />

          <label>Password</label>
          <div class="password-box">
            <input
              v-model="instructorForm.password"
              :type="showInstructorPassword ? 'text' : 'password'"
              placeholder="Enter password"
            />

            <button
              type="button"
              class="eye-btn"
              @click="showInstructorPassword = !showInstructorPassword"
            >
              <svg
                v-if="showInstructorPassword"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>

              <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7a18.7 18.7 0 0 1-2.16 3.19"/>
                <path d="M6.61 6.61A18.7 18.7 0 0 0 2 12s3.5 7 10 7a10.43 10.43 0 0 0 5.39-1.61"/>
                <line x1="2" y1="2" x2="22" y2="22"/>
              </svg>
            </button>
          </div>

          <label>Role</label>
          <select v-model="instructorForm.role">
            <option value="instructor">Instructor</option>
            <option value="admin">Admin</option>
          </select>

          <button class="save-btn" @click="saveInstructor">
            {{ editingInstructorId ? 'Update Account' : 'Create Account' }}
          </button>

          <button
            v-if="editingInstructorId"
            class="reset-btn"
            @click="resetInstructorForm"
          >
            Cancel Edit
          </button>
        </div>

        <div class="panel">
          <h3>Admin and Instructor List</h3>

          <div v-if="instructorAccounts.length === 0" class="empty">
            <div>
              <div class="empty-icon">👥</div>
              <h2>No accounts yet</h2>
              <p>Created accounts will appear here.</p>
            </div>
          </div>

          <div v-else class="account-list">
            <div
              v-for="account in instructorAccounts"
              :key="account.id"
              class="account-item"
            >
              <div>
                <h4>{{ account.fullName }}</h4>
                <p>{{ account.email }}</p>
                <small>{{ account.id }}</small>
              </div>

              <div class="actions">
                <span
                  class="role-pill"
                  :class="{ admin: account.role === 'admin' }"
                >
                  {{ account.role }}
                </span>

                <button class="edit" @click="editInstructor(account)">
                  Edit
                </button>

                <button class="delete" @click="deleteInstructor(account.id)">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="panel notice-panel">
        <h3>Role Access</h3>

        <div class="message">
          You are logged in as instructor. Only admin accounts can create accounts and edit account roles.
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

.main-grid,
.admin-grid{
  display:grid;
  grid-template-columns:360px 1fr;
  gap:16px;
  align-items:start;
}

.admin-grid{
  margin-top:16px;
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
  outline:none;
  background:white;
}

input:disabled{
  background:#f8fafc;
  color:#64748b;
}

.password-box{
  position:relative;
  width:100%;
  margin-bottom:12px;
}

.password-box input{
  margin-bottom:0;
  padding-right:52px;
}

.eye-btn{
  position:absolute;
  right:10px;
  top:50%;
  transform:translateY(-50%);
  width:34px;
  height:34px;
  border:none;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  color:#020817;
  border-radius:50%;
}

.eye-btn:hover{
  background:#f1f5f9;
}

.save-btn,
.reset-btn{
  width:100%;
  height:46px;
  border:none;
  border-radius:12px;
  font-size:15px;
  font-weight:800;
  cursor:pointer;
}

.save-btn{
  background:#2563eb;
  color:white;
  margin-bottom:10px;
}

.reset-btn{
  background:#e2e8f0;
  color:#020817;
}

.preview-card{
  background:#f8fafc;
  border-radius:14px;
  padding:24px;
  text-align:center;
}

.preview-avatar{
  width:64px;
  height:64px;
  border-radius:50%;
  background:#dbeafe;
  display:grid;
  place-items:center;
  margin:0 auto 14px;
  font-size:30px;
}

.preview-card h2{
  font-size:22px;
  font-weight:900;
  margin-bottom:6px;
  color:#020817;
}

.preview-card p{
  color:#64748b;
  margin-bottom:12px;
  font-size:15px;
}

.role-badge,
.role-pill{
  display:inline-block;
  padding:8px 12px;
  border-radius:999px;
  background:#dcfce7;
  color:#166534;
  font-size:12px;
  font-weight:800;
  text-transform:capitalize;
}

.role-pill.admin{
  background:#ede9fe;
  color:#6d28d9;
}

.notice-panel{
  margin-top:16px;
}

.message{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  color:#334155;
  line-height:1.6;
  font-size:15px;
}

.account-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.account-item{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:12px;
}

.account-item h4{
  font-size:17px;
  color:#020817;
  margin-bottom:4px;
}

.account-item p{
  color:#64748b;
  font-size:14px;
  margin-bottom:4px;
}

.account-item small{
  font-size:13px;
  color:#0f172a;
  font-weight:700;
}

.actions{
  display:flex;
  align-items:center;
  gap:8px;
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
  .main-grid,
  .admin-grid{
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

  .account-item{
    flex-direction:column;
    align-items:flex-start;
  }

  .actions{
    flex-wrap:wrap;
  }

  .modal-actions{
    flex-direction:column;
  }
}
</style>