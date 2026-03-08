import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,
})

export const predictFood = async (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await api.post('/predict-food', formData)
  return response.data
}

export const predictFoodTopK = async (imageFile, k = 5) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  const response = await api.post(`/predict-food/top-k?k=${k}`, formData)
  return response.data
}

export const predictBodyFat = async (images, weightKg = 70, heightCm = 175, gender = 'male', age = 25) => {
  const formData = new FormData()
  formData.append('front', images.front)
  formData.append('back', images.back)
  formData.append('left', images.left)
  formData.append('right', images.right)
  formData.append('weight_kg', weightKg)
  formData.append('height_cm', heightCm)
  formData.append('gender', gender)
  formData.append('age', age)
  const response = await api.post('/predict-bodyfat', formData)
  return response.data
}

export default api
