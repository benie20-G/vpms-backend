
# Frontend Integration Guide

This document provides instructions for connecting the React frontend to the backend API.

## Authentication

### User Registration

```typescript
const registerUser = async (userData: { email: string; password: string; name: string; }) => {
  const response = await fetch('http://localhost:4000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }
  
  return response.json();
};
```

### User Login

```typescript
const loginUser = async (credentials: { email: string; password: string; }) => {
  const response = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }
  
  const data = await response.json();
  
  // Store token and user data
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};
```

## API Helper Function

Create a helper function for making authenticated requests:

```typescript
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const response = await fetch(`http://localhost:4000${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  return response.json();
};
```

## Vehicle Management

### Get All Vehicles

```typescript
const getVehicles = async () => {
  return apiRequest('/api/vehicles');
};
```

### Create Vehicle

```typescript
const createVehicle = async (vehicleData: { plateNumber: string; make: string; model: string; color: string; }) => {
  return apiRequest('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });
};
```

### Update Vehicle

```typescript
const updateVehicle = async (id: string, vehicleData: Partial<{ plateNumber: string; make: string; model: string; color: string; }>) => {
  return apiRequest(`/api/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  });
};
```

### Delete Vehicle

```typescript
const deleteVehicle = async (id: string) => {
  return apiRequest(`/api/vehicles/${id}`, {
    method: 'DELETE',
  });
};
```

## Parking Management

### Get Parking Sessions

```typescript
const getParkingSessions = async (filters?: { vehicleId?: string; status?: 'ACTIVE' | 'COMPLETED' | 'PENDING_PAYMENT'; }) => {
  const queryParams = new URLSearchParams();
  
  if (filters?.vehicleId) {
    queryParams.append('vehicleId', filters.vehicleId);
  }
  
  if (filters?.status) {
    queryParams.append('status', filters.status);
  }
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
  return apiRequest(`/api/parking${queryString}`);
};
```

### Check In Vehicle

```typescript
const checkInVehicle = async (vehicleId: string) => {
  return apiRequest('/api/parking/checkin', {
    method: 'POST',
    body: JSON.stringify({ vehicleId }),
  });
};
```

### Request Checkout

```typescript
const requestCheckout = async (sessionId: string) => {
  return apiRequest(`/api/parking/request-checkout/${sessionId}`, {
    method: 'POST',
  });
};
```

### Checkout Vehicle (Admin Only)

```typescript
const checkOutVehicle = async (sessionId: string) => {
  return apiRequest(`/api/parking/checkout/${sessionId}`, {
    method: 'POST',
  });
};
```

## Notifications

### Get User Notifications

```typescript
const getUserNotifications = async () => {
  return apiRequest('/api/notifications');
};
```

### Mark Notification as Read

```typescript
const markNotificationAsRead = async (id: string) => {
  return apiRequest(`/api/notifications/${id}/read`, {
    method: 'PUT',
  });
};
```

### Mark All Notifications as Read

```typescript
const markAllNotificationsAsRead = async () => {
  return apiRequest('/api/notifications/read-all', {
    method: 'PUT',
  });
};
```

## Profile Management

### Get User Profile

```typescript
const getUserProfile = async () => {
  return apiRequest('/api/users/profile');
};
```

### Update User Profile

```typescript
const updateUserProfile = async (profileData: { name?: string; phoneNumber?: string; }) => {
  return apiRequest('/api/users/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};
```

### Update Password

```typescript
const updatePassword = async (passwordData: { currentPassword: string; newPassword: string; }) => {
  return apiRequest('/api/users/password', {
    method: 'PUT',
    body: JSON.stringify(passwordData),
  });
};
```
