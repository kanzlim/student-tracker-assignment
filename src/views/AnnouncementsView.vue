<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()

const announcements = ref([])
const editingId = ref(null)
const isLoading = ref(false)

const notification = ref({
  show: false,
  message: '',
  type: 'success'
})

const form = ref({
  title: '',
  course: '',
  yearLevel: '',
  message: ''
})

const showNotification = (message, type = 'success') => {
  notification.value = {
    show: true,
    message,
    type
  }

  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const loadAnnouncements = async () => {
  isLoading.value = true

  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.log(error)
    showNotification('Failed to load announcements.', 'error')
    isLoading.value = false
    return
  }

  announcements.value = data.map(item => ({
    announcementId: item.id,
    title: item.title,
    course: item.course,
    yearLevel: item.year_level,
    message: item.message,
    createdAt: item.created_at
  }))

  isLoading.value = false
}

onMounted(async () => {
  await loadAnnouncements()
})

const totalAnnouncements = computed(() =>
  announcements.value.length
)

const resetForm = () => {
  form.value = {
    title: '',
    course: '',
    yearLevel: '',
    message: ''
  }

  editingId.value = null
}

const createAnnouncement = async () => {
  if (
    !form.value.title ||
    !form.value.course ||
    !form.value.yearLevel ||
    !form.value.message
  ) {
    showNotification('Please fill in all fields.', 'error')
    return
  }

  if (editingId.value) {
    const { error } = await supabase
      .from('announcements')
      .update({
        title: form.value.title,
        course: form.value.course,
        year_level: form.value.yearLevel,
        message: form.value.message
      })
      .eq('id', editingId.value)

    if (error) {
      console.log(error)
      showNotification('Failed to update announcement.', 'error')
      return
    }

    showNotification('Announcement updated successfully.')
  } else {
    const { error } = await supabase
      .from('announcements')
      .insert([
        {
          title: form.value.title,
          course: form.value.course,
          year_level: form.value.yearLevel,
          message: form.value.message
        }
      ])

    if (error) {
      console.log(error)
      showNotification('Failed to create announcement.', 'error')
      return
    }

    showNotification('Announcement created successfully.')
  }

  resetForm()
  await loadAnnouncements()
}

const editAnnouncement = (announcement) => {
  form.value = {
    title: announcement.title,
    course: announcement.course,
    yearLevel: announcement.yearLevel,
    message: announcement.message
  }

  editingId.value = announcement.announcementId
}

const deleteAnnouncement = async (announcement) => {
  if (!confirm('Delete this announcement?')) return

  const { error } = await supabase
    .from('announcements')
    .delete()
    .eq('id', announcement.announcementId)

  if (error) {
    console.log(error)
    showNotification('Failed to delete announcement.', 'error')
    return
  }

  showNotification('Announcement deleted successfully.')
  await loadAnnouncements()
}

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/')
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

    <aside class="sidebar">
      <h1>
        Student Tracker
      </h1>

      <nav class="menu">
        <router-link
          to="/dashboard"
          class="nav"
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
          class="nav active"
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
          <h2>
            Announcements
          </h2>

          <p>
            Post announcements for
            courses and year levels.
          </p>
        </div>

        <div class="profile">
          👤
        </div>
      </div>

      <div class="cards">
        <div class="card">
          <div class="icon">
            📢
          </div>

          <div>
            <span>
              Total Announcements
            </span>

            <h3>
              {{ totalAnnouncements }}
            </h3>
          </div>
        </div>
      </div>

      <div class="main-grid">
        <div class="panel">
          <h3>
            {{
              editingId
                ? 'Edit Announcement'
                : 'Create Announcement'
            }}
          </h3>

          <label>
            Title
          </label>

          <input
            v-model="form.title"
            type="text"
            placeholder="Announcement title"
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

          <select
            v-model="form.yearLevel"
          >
            <option value="">
              Select Year Level
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
            Message
          </label>

          <textarea
            v-model="form.message"
            placeholder="Enter announcement message"
          ></textarea>

          <button
            class="save-btn"
            @click="createAnnouncement"
          >
            {{
              editingId
                ? 'Update Announcement'
                : 'Create Announcement'
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
            Announcement List
          </h3>

          <div
            v-if="isLoading"
            class="empty"
          >
            <div>
              <div class="empty-icon">
                ⏳
              </div>

              <h2>
                Loading announcements...
              </h2>
            </div>
          </div>

          <div
            v-else-if="announcements.length === 0"
            class="empty"
          >
            <div>
              <div class="empty-icon">
                📢
              </div>

              <h2>
                No announcements yet
              </h2>
            </div>
          </div>

          <div
            v-else
            class="announcement-list"
          >
            <div
              v-for="announcement in announcements"
              :key="announcement.announcementId"
              class="announcement-item"
            >
              <div>
                <h4>
                  {{ announcement.title }}
                </h4>

                <p>
                  {{ announcement.course }}
                  •
                  {{ announcement.yearLevel }}
                </p>

                <small>
                  {{
                    new Date(announcement.createdAt)
                      .toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                  }}
                </small>

                <div class="message-box">
                  {{ announcement.message }}
                </div>
              </div>

              <div class="actions">
                <button
                  class="edit"
                  @click="editAnnouncement(announcement)"
                >
                  Edit
                </button>

                <button
                  class="delete"
                  @click="deleteAnnouncement(announcement)"
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

.notification{
  position:fixed;
  top:20px;
  right:20px;
  padding:14px 18px;
  border-radius:12px;
  color:white;
  font-weight:700;
  z-index:9999;
  animation:slideIn .25s ease;
  box-shadow:0 10px 25px rgba(0,0,0,0.2);
}

.notification.success{
  background:#16a34a;
}

.notification.error{
  background:#dc2626;
}

@keyframes slideIn{
  from{
    opacity:0;
    transform:translateY(-10px);
  }

  to{
    opacity:1;
    transform:translateY(0);
  }
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
  grid-template-columns:1fr;
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
select,
textarea{
  width:100%;
  border:1px solid #cbd5e1;
  border-radius:12px;
  padding:0 12px;
  font-size:14px;
  margin-bottom:12px;
  background:white;
}

input,
select{
  height:44px;
}

textarea{
  height:120px;
  padding:12px;
  resize:none;
}

.save-btn,
.cancel-btn{
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
}

.cancel-btn{
  background:#e2e8f0;
  color:#020817;
  margin-top:10px;
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

.announcement-list{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.announcement-item{
  background:#f8fafc;
  border-radius:14px;
  padding:16px;
  display:flex;
  justify-content:space-between;
  gap:16px;
}

.announcement-item h4{
  font-size:18px;
  margin-bottom:6px;
  color:#020817;
}

.announcement-item p{
  color:#64748b;
  font-size:14px;
  margin-bottom:6px;
}

.message-box{
  margin-top:12px;
  background:white;
  border-radius:12px;
  padding:14px;
  line-height:1.6;
  color:#0f172a;
}

.actions{
  display:flex;
  flex-direction:column;
  gap:8px;
}

.edit{
  border:none;
  border-radius:10px;
  padding:10px 14px;
  background:#fef3c7;
  color:#92400e;
  font-weight:800;
  cursor:pointer;
}

.delete{
  border:none;
  border-radius:10px;
  padding:10px 14px;
  background:#fee2e2;
  color:#b91c1c;
  font-weight:800;
  cursor:pointer;
}

@media(max-width:1100px){
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

  .announcement-item{
    flex-direction:column;
  }

  .actions{
    flex-direction:row;
  }
}
</style>