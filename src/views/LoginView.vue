<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

const selectedRole = ref('student')
const showPassword = ref(false)

const email = ref('')
const password = ref('')

const showForgotModal = ref(false)
const resetEmail = ref('')
const resetNewPassword = ref('')
const showResetPassword = ref(false)

const isLoading = ref(false)

const notification = ref({
  show: false,
  type: 'error',
  message: ''
})

const showNotification = (message, type = 'error') => {
  notification.value = {
    show: true,
    type,
    message
  }

  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const handleLogin = async () => {
  if (isLoading.value) return

  const loginEmail = email.value.trim().toLowerCase()
  const loginPassword = password.value.trim()

  if (!loginEmail || !loginPassword) {
    showNotification('Please enter email and password.')
    return
  }

  isLoading.value = true

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', loginEmail)
    .maybeSingle()

  isLoading.value = false

  if (error) {
    console.log(error)
    showNotification('Login error. Please check your Supabase policy.')
    return
  }

  if (!data) {
    showNotification('Invalid email or password.')
    return
  }

  if (String(data.password || '').trim() !== loginPassword) {
    showNotification('Invalid email or password.')
    return
  }

  const userRole = String(data.role || '').trim().toLowerCase()

  if (
    selectedRole.value === 'student' &&
    userRole !== 'student'
  ) {
    showNotification('This account is not a student account.')
    return
  }

  if (
    selectedRole.value === 'instructor' &&
    !['admin', 'instructor'].includes(userRole)
  ) {
    showNotification('This account is not an instructor/admin account.')
    return
  }

  const currentUser = {
    id: data.id,
    fullName: data.full_name,
    email: data.email,
    password: data.password,
    role: userRole,
    course: data.course,
    yearLevel: data.year_level
  }

  localStorage.setItem(
    'currentUser',
    JSON.stringify(currentUser)
  )

  showNotification('Login successful.', 'success')

  setTimeout(() => {
    if (userRole === 'student') {
      window.location.replace('/student-dashboard')
    } else {
      window.location.replace('/dashboard')
    }
  }, 600)
}

const resetPassword = async () => {
  const emailToReset = resetEmail.value.trim().toLowerCase()
  const newPassword = resetNewPassword.value.trim()

  if (!emailToReset || !newPassword) {
    showNotification('Please fill in all fields.')
    return
  }

  const { data, error: findError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', emailToReset)
    .maybeSingle()

  if (findError) {
    console.log(findError)
    showNotification('Error checking account.')
    return
  }

  if (!data) {
    showNotification('Account email not found.')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      password: newPassword
    })
    .eq('email', emailToReset)

  if (error) {
    console.log(error)
    showNotification('Failed to reset password.')
    return
  }

  showNotification('Password reset successfully.', 'success')

  resetEmail.value = ''
  resetNewPassword.value = ''
  showForgotModal.value = false
}
</script>

<template>
  <main class="page">
    <div
      v-if="notification.show"
      class="notification"
      :class="notification.type"
    >
      {{ notification.message }}
    </div>

    <section class="layout">
      <div class="left">
        <h1>
          Student Tracker
          <span>Assignment</span>
        </h1>

        <p>
          Track students, assignments, deadlines,
          and progress in one clean dashboard.
        </p>

        <div class="line"></div>

        <div class="feature">
          <div class="icon blue">📄</div>

          <div>
            <h3>Manage assignments</h3>
            <p>Create and organize assignments easily.</p>
          </div>
        </div>

        <div class="feature">
          <div class="icon purple">👨‍🎓</div>

          <div>
            <h3>Track students</h3>
            <p>Monitor student activities and progress.</p>
          </div>
        </div>

        <div class="feature">
          <div class="icon green">✅</div>

          <div>
            <h3>Monitor progress</h3>
            <p>Keep track of completion status.</p>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="avatar">👤</div>

        <h2>Hello, Ready to Stay Organized?</h2>

        <p class="subtitle">
          Login as {{ selectedRole === 'student' ? 'Student' : 'Instructor/Admin' }}
        </p>

        <div class="role-tabs">
          <button
            type="button"
            class="role"
            :class="{ active: selectedRole === 'student' }"
            @click="selectedRole = 'student'"
          >
            Student
          </button>

          <button
            type="button"
            class="role"
            :class="{ active: selectedRole === 'instructor' }"
            @click="selectedRole = 'instructor'"
          >
            Instructor/Admin
          </button>
        </div>

        <label>Email Address</label>

        <div class="input-box">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
          />
        </div>

        <label>Password</label>

        <div class="input-box">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
          />

          <button
            type="button"
            class="eye-btn"
            @click="showPassword = !showPassword"
          >
            <svg
              v-if="showPassword"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
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
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c6.5 0 10 7 10 7"/>
              <path d="M6.61 6.61A18.7 18.7 0 0 0 2 12s3.5 7 10 7"/>
              <line x1="2" y1="2" x2="22" y2="22"/>
            </svg>
          </button>
        </div>

        <div class="options">
          <label class="remember">
            <input type="checkbox" />
            Remember me
          </label>

          <a
            href="#"
            @click.prevent="showForgotModal = true"
          >
            Forgot password?
          </a>
        </div>

        <button
          type="button"
          class="login-btn"
          :disabled="isLoading"
          @click="handleLogin"
        >
          {{
            isLoading
              ? 'Logging in...'
              : `Login as ${selectedRole === 'student' ? 'Student' : 'Instructor/Admin'}`
          }}
        </button>

        <div class="divider">
          <span></span>
          <p>OR</p>
          <span></span>
        </div>

        <p class="create">
          Don’t have an account?

          <router-link to="/register">
            Create one
          </router-link>
        </p>
      </div>
    </section>

    <div v-if="showForgotModal" class="modal-bg">
      <div class="modal">
        <h2>Reset Password</h2>

        <label>Email Address</label>
        <input
          v-model="resetEmail"
          type="email"
          placeholder="Enter your email"
        />

        <label>New Password</label>

        <div class="input-box">
          <input
            v-model="resetNewPassword"
            :type="showResetPassword ? 'text' : 'password'"
            placeholder="Enter new password"
          />

          <button
            type="button"
            class="eye-btn"
            @click="showResetPassword = !showResetPassword"
          >
            Show
          </button>
        </div>

        <div class="modal-actions">
          <button
            class="cancel-btn"
            @click="showForgotModal = false"
          >
            Cancel
          </button>

          <button class="save-btn" @click="resetPassword">
            Reset Password
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
html,
body,
#app{
  margin:0;
  padding:0;
  width:100%;
  min-height:100%;
  overflow-x:hidden;
  background:#020817;
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

.notification{
  position:fixed;
  top:20px;
  right:20px;
  z-index:1000;
  padding:14px 18px;
  border-radius:14px;
  color:white;
  font-size:14px;
  font-weight:800;
  box-shadow:0 10px 30px rgba(0,0,0,0.25);
}

.notification.error{
  background:#ef4444;
}

.notification.success{
  background:#22c55e;
}

.page{
  width:100%;
  min-height:100vh;
  background:
  radial-gradient(circle at top left,#0b5cff 0 10%,transparent 30%),
  linear-gradient(135deg,#020817,#06256f);
  overflow:hidden;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:Arial,sans-serif;
}

.layout{
  width:100%;
  min-height:100vh;
  display:grid;
  grid-template-columns:1fr 420px;
  align-items:center;
  gap:50px;
  padding:30px 5%;
}

.left{
  color:white;
}

.left h1{
  font-size:clamp(42px,6vw,80px);
  line-height:0.95;
  font-weight:900;
  margin-bottom:22px;
}

.left h1 span{
  display:block;
  color:#2f73ff;
}

.left p{
  max-width:540px;
  font-size:18px;
  line-height:1.6;
  color:#dbeafe;
}

.line{
  width:80px;
  height:4px;
  border-radius:20px;
  background:#2f73ff;
  margin:32px 0;
}

.feature{
  max-width:500px;
  display:flex;
  align-items:center;
  gap:16px;
  padding:16px;
  border-radius:18px;
  margin-bottom:16px;
  background:rgba(255,255,255,0.12);
  backdrop-filter:blur(8px);
}

.icon{
  width:52px;
  height:52px;
  border-radius:14px;
  display:grid;
  place-items:center;
  font-size:20px;
  flex-shrink:0;
}

.blue{
  background:#2563eb;
}

.purple{
  background:#7c3aed;
}

.green{
  background:#22c55e;
}

.feature h3{
  font-size:20px;
  margin-bottom:4px;
}

.feature p{
  font-size:14px;
}

.card{
  width:100%;
  max-width:420px;
  background:white;
  border-radius:28px;
  padding:32px 28px;
  box-shadow:0 20px 60px rgba(0,0,0,0.35);
}

.avatar{
  width:64px;
  height:64px;
  margin:0 auto 18px;
  border-radius:50%;
  background:#edf2ff;
  display:grid;
  place-items:center;
  font-size:28px;
}

.card h2{
  text-align:center;
  font-size:30px;
  line-height:1.2;
  margin-bottom:8px;
  color:#020817;
}

.subtitle{
  text-align:center;
  color:#64748b;
  font-size:15px;
  margin-bottom:24px;
}

.role-tabs{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
  margin-bottom:22px;
}

.role{
  height:48px;
  border-radius:14px;
  border:1px solid #cbd5e1;
  background:#f8fafc;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
  transition:0.2s;
}

.role.active{
  background:#020817;
  color:white;
}

label{
  display:block;
  margin-bottom:8px;
  font-size:14px;
  font-weight:700;
}

.input-box{
  height:54px;
  border:1px solid #cbd5e1;
  border-radius:14px;
  padding:0 14px;
  display:flex;
  align-items:center;
  margin-bottom:18px;
  transition:0.2s;
}

.input-box:focus-within{
  border-color:#0b5cff;
}

.input-box input{
  width:100%;
  height:100%;
  border:none;
  outline:none;
  background:transparent;
  font-size:15px;
}

.eye-btn{
  width:34px;
  height:34px;
  border:none;
  background:transparent;
  display:flex;
  align-items:center;
  justify-content:center;
  border-radius:50%;
  cursor:pointer;
  color:#111827;
  flex-shrink:0;
  font-size:12px;
  font-weight:700;
}

.eye-btn:hover{
  background:#f1f5f9;
}

.options{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:24px;
}

.remember{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:13px;
}

.options a{
  color:#0b5cff;
  text-decoration:none;
  font-size:13px;
  font-weight:700;
}

.login-btn{
  width:100%;
  height:54px;
  border:none;
  border-radius:14px;
  background:linear-gradient(135deg,#0b5cff,#003cff);
  color:white;
  font-size:17px;
  font-weight:800;
  cursor:pointer;
  transition:0.2s;
}

.login-btn:disabled{
  opacity:0.75;
  cursor:not-allowed;
}

.login-btn:hover{
  transform:translateY(-2px);
}

.login-btn:disabled:hover{
  transform:none;
}

.divider{
  display:flex;
  align-items:center;
  gap:14px;
  margin:24px 0;
}

.divider span{
  flex:1;
  height:1px;
  background:#dbe2ea;
}

.divider p{
  color:#64748b;
  font-size:13px;
}

.create{
  text-align:center;
  font-size:14px;
  color:#475569;
}

.create a{
  color:#0b5cff;
  text-decoration:none;
  font-weight:700;
}

.modal-bg{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,0.55);
  display:grid;
  place-items:center;
  padding:20px;
  z-index:999;
}

.modal{
  width:100%;
  max-width:420px;
  background:white;
  border-radius:22px;
  padding:24px;
}

.modal h2{
  margin-bottom:18px;
}

.modal input{
  width:100%;
  height:52px;
  border:1px solid #cbd5e1;
  border-radius:14px;
  padding:0 14px;
  font-size:15px;
  margin-bottom:16px;
}

.modal-actions{
  display:flex;
  gap:10px;
  margin-top:18px;
}

.cancel-btn,
.save-btn{
  flex:1;
  height:48px;
  border:none;
  border-radius:14px;
  font-weight:800;
  cursor:pointer;
}

.cancel-btn{
  background:#e2e8f0;
}

.save-btn{
  background:#2563eb;
  color:white;
}

@media(max-width:1000px){
  .layout{
    grid-template-columns:1fr;
    padding:40px 20px;
  }

  .left{
    text-align:center;
  }

  .left p{
    margin:auto;
  }

  .line{
    margin:30px auto;
  }

  .feature{
    margin-left:auto;
    margin-right:auto;
    text-align:left;
  }

  .card{
    margin:auto;
  }
}

@media(max-width:600px){
  .layout{
    gap:30px;
    padding:20px 14px;
  }

  .left h1{
    font-size:46px;
  }

  .left p{
    font-size:15px;
  }

  .feature{
    padding:14px;
  }

  .feature h3{
    font-size:17px;
  }

  .feature p{
    font-size:13px;
  }

  .card{
    padding:24px 18px;
    border-radius:24px;
  }

  .card h2{
    font-size:24px;
  }

  .options{
    flex-direction:column;
    align-items:flex-start;
    gap:12px;
  }
}
</style>