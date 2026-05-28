<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const student_id = ref('')
const fullName = ref('')
const email = ref('')
const course = ref('')
const yearLevel = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

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

const handleRegister = async () => {
  if (isLoading.value) return

  const trimmedStudentId = student_id.value.trim()
  const trimmedName = fullName.value.trim()
  const trimmedEmail = email.value.trim().toLowerCase()

  if (!trimmedStudentId) {
    showNotification('Student ID is required.')
    return
  }

  if (!trimmedName) {
    showNotification('Full Name is required.')
    return
  }

  if (!trimmedEmail) {
    showNotification('Email Address is required.')
    return
  }

  if (!course.value) {
    showNotification('Course is required.')
    return
  }

  if (!yearLevel.value) {
    showNotification('Year Level is required.')
    return
  }

  if (!password.value) {
    showNotification('Password is required.')
    return
  }

  if (!confirmPassword.value) {
    showNotification('Confirm Password is required.')
    return
  }

  if (password.value !== confirmPassword.value) {
    showNotification('Passwords do not match.')
    return
  }

  isLoading.value = true

  const { data: existingEmail } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', trimmedEmail)
    .maybeSingle()

  if (existingEmail) {
    isLoading.value = false
    showNotification('This email is already registered.')
    return
  }

  const { data: existingStudentId } = await supabase
    .from('profiles')
    .select('*')
    .eq('student_id', trimmedStudentId)
    .maybeSingle()

  if (existingStudentId) {
    isLoading.value = false
    showNotification('This Student ID is already registered.')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .insert([
      {
        student_id: trimmedStudentId,
        full_name: trimmedName,
        email: trimmedEmail,
        course: course.value,
        year_level: yearLevel.value,
        password: password.value,
        role: 'student',
        status: 'Enrolled'
      }
    ])

  isLoading.value = false

  if (error) {
    console.log(error)
    showNotification('Failed to create student account.')
    return
  }

  showNotification(
    'Student account created successfully!',
    'success'
  )

  setTimeout(() => {
    router.push('/')
  }, 1200)
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

    <section class="card">
      <div class="avatar">👤</div>

      <h2>Create Student Account</h2>

      <p class="subtitle">
        Register your student account
      </p>

      <label>Student ID <span>*</span></label>

      <div class="input-box">
        <input
          v-model="student_id"
          type="text"
          placeholder="Enter student ID"
        />
      </div>

      <label>Full Name <span>*</span></label>

      <div class="input-box">
        <input
          v-model="fullName"
          type="text"
          placeholder="Enter full name"
        />
      </div>

      <label>Email Address <span>*</span></label>

      <div class="input-box">
        <input
          v-model="email"
          type="email"
          placeholder="Enter email address"
        />
      </div>

      <label>Course / Section <span>*</span></label>

      <div class="input-box">
        <select v-model="course">
          <option value="">Select course</option>
          <option value="BSIT">BSIT</option>
          <option value="BSIS">BSIS</option>
          <option value="BSCS">BSCS</option>
        </select>
      </div>

      <label>Year Level <span>*</span></label>

      <div class="input-box">
        <select v-model="yearLevel">
          <option value="">Select year level</option>
          <option>1st Year</option>
          <option>2nd Year</option>
          <option>3rd Year</option>
          <option>4th Year</option>
        </select>
      </div>

      <label>Password <span>*</span></label>

      <div class="input-box">
        <input
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Create password"
        />

        <button
          type="button"
          class="eye-btn"
          @click="showPassword = !showPassword"
        >
          👁
        </button>
      </div>

      <label>Confirm Password <span>*</span></label>

      <div class="input-box">
        <input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          placeholder="Confirm password"
        />

        <button
          type="button"
          class="eye-btn"
          @click="showConfirmPassword = !showConfirmPassword"
        >
          👁
        </button>
      </div>

      <button
        class="register-btn"
        :disabled="isLoading"
        @click="handleRegister"
      >
        {{
          isLoading
            ? 'Creating Account...'
            : 'Create Student Account'
        }}
      </button>

      <p class="login-text">
        Already have an account?

        <router-link to="/">
          Login here
        </router-link>
      </p>
    </section>
  </main>
</template>

<style>
html,
body,
#app {
  width: 100%;
  min-height: 100vh;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  background: #020817;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  padding: 14px 20px;
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  animation: slideIn 0.3s ease;
}

.notification.success {
  background: #22c55e;
}

.notification.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page {
  width: 100%;
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, #0b5cff 0 10%, transparent 30%),
    linear-gradient(135deg, #020817, #06256f);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  font-family: Arial, sans-serif;
}

.card {
  width: 100%;
  max-width: 520px;
  background: white;
  border-radius: 28px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
}

.avatar {
  width: 58px;
  height: 58px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: #edf2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card h2 {
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #020817;
}

.subtitle {
  text-align: center;
  color: #64748b;
  margin-bottom: 24px;
  font-size: 15px;
}

label {
  display: block;
  margin-bottom: 8px;
  margin-top: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #020817;
}

label span {
  color: #ef4444;
}

.input-box {
  width: 100%;
  height: 56px;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 0 16px;
  display: flex;
  align-items: center;
}

.input-box input,
.input-box select {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
}

.eye-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.register-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 16px;
  margin-top: 24px;
  background: linear-gradient(135deg, #0b5cff, #003cff);
  color: white;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}

.register-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-text {
  margin-top: 20px;
  text-align: center;
  color: #64748b;
  font-size: 15px;
}

.login-text a {
  color: #0b5cff;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 600px) {
  .card {
    padding: 24px 20px;
  }
}
</style>