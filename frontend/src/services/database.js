/**
 * Servicio de Base de Datos Local usando localStorage
 * Almacena usuarios con todos sus datos incluyendo reconocimiento facial
 */

const DB_KEY = 'velora_users_db';
const SESSION_KEY = 'velora_current_user';

/**
 * Estructura de usuario:
 * {
 *   id: number,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   password: string,
 *   address: string,
 *   city: string,
 *   country: string,
 *   walletUrl: string,
 *   keyId: string,
 *   privateKey: string,
 *   pin: string,
 *   faceId: string,  // ID único del reconocimiento facial
 *   faceDescriptors: array,  // Descriptores faciales de face-api.js
 *   createdAt: string,
 *   lastLogin: string
 * }
 */

// Inicializar base de datos
function initDB() {
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify([]));
  }
}

// Obtener todos los usuarios
export function getAllUsers() {
  initDB();
  const users = localStorage.getItem(DB_KEY);
  return JSON.parse(users) || [];
}

// Obtener usuario por ID
export function getUserById(id) {
  const users = getAllUsers();
  return users.find(user => user.id === id);
}

// Obtener usuario por email
export function getUserByEmail(email) {
  const users = getAllUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase());
}

// Obtener usuario por Face ID
export function getUserByFaceId(faceId) {
  const users = getAllUsers();
  return users.find(user => user.faceId === faceId);
}

// Registrar nuevo usuario
export function registerUser(userData) {
  const users = getAllUsers();
  
  // Verificar si el email ya existe
  const existingUser = getUserByEmail(userData.email);
  if (existingUser) {
    throw new Error('El email ya está registrado');
  }
  
  // Verificar si el faceId ya existe
  if (userData.faceId) {
    const existingFaceUser = getUserByFaceId(userData.faceId);
    if (existingFaceUser) {
      throw new Error('Este rostro ya está registrado');
    }
  }
  
  // Normalizar descriptores faciales para asegurar que sean arrays simples
  let normalizedDescriptors = [];
  if (userData.faceDescriptors) {
    normalizedDescriptors = userData.faceDescriptors.map(descriptor => {
      // Si es Float32Array o similar, convertir a array normal
      if (descriptor instanceof Float32Array || descriptor.buffer) {
        return Array.from(descriptor);
      }
      // Si ya es array, devolverlo
      return descriptor;
    });
    
    console.log('📊 Descriptores normalizados:', normalizedDescriptors.length, 'descriptores, cada uno con', normalizedDescriptors[0]?.length, 'dimensiones');
  }
  
  // Crear nuevo usuario con ID autoincremental
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    ...userData,
    faceDescriptors: normalizedDescriptors, // Usar descriptores normalizados
    createdAt: new Date().toISOString(),
    lastLogin: null
  };
  
  users.push(newUser);
  localStorage.setItem(DB_KEY, JSON.stringify(users));
  
  console.log('✅ Usuario registrado en DB local:', newUser.email, 'ID:', newUser.id, 'FaceID:', newUser.faceId);
  
  return newUser;
}

// Login con email y password
export function loginWithPassword(email, password) {
  const user = getUserByEmail(email);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  if (user.password !== password) {
    throw new Error('Contraseña incorrecta');
  }
  
  // Actualizar último login
  user.lastLogin = new Date().toISOString();
  updateUser(user);
  
  // Guardar sesión
  setCurrentUser(user);
  
  console.log('✅ Login exitoso:', user.email);
  
  return user;
}

// Login con Face ID
export function loginWithFaceId(faceId) {
  const user = getUserByFaceId(faceId);
  
  if (!user) {
    throw new Error('Rostro no reconocido');
  }
  
  // Actualizar último login
  user.lastLogin = new Date().toISOString();
  updateUser(user);
  
  // Guardar sesión
  setCurrentUser(user);
  
  console.log('✅ Login facial exitoso:', user.email, 'FaceID:', faceId);
  
  return user;
}

// Verificar PIN
export function verifyPin(userId, pin) {
  const user = getUserById(userId);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }
  
  if (user.pin !== pin) {
    throw new Error('PIN incorrecto');
  }
  
  console.log('✅ PIN verificado correctamente para usuario:', user.email);
  
  return true;
}

// Actualizar usuario
export function updateUser(updatedUser) {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  
  if (index === -1) {
    throw new Error('Usuario no encontrado');
  }
  
  users[index] = updatedUser;
  localStorage.setItem(DB_KEY, JSON.stringify(users));
  
  return updatedUser;
}

// Eliminar usuario
export function deleteUser(userId) {
  const users = getAllUsers();
  const filteredUsers = users.filter(u => u.id !== userId);
  localStorage.setItem(DB_KEY, JSON.stringify(filteredUsers));
  
  console.log('🗑️ Usuario eliminado:', userId);
}

// Sesión actual
export function setCurrentUser(user) {
  const userSession = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    faceId: user.faceId,
    loginAt: new Date().toISOString()
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
}

export function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) return null;
  
  const userSession = JSON.parse(session);
  // Obtener datos completos del usuario
  return getUserById(userSession.id);
}

export function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn() {
  return !!getCurrentUser();
}

// Utilidades de búsqueda de rostros
export function findUserByDescriptors(descriptorToMatch, threshold = 0.6) {
  const users = getAllUsers();
  
  for (const user of users) {
    if (!user.faceDescriptors || user.faceDescriptors.length === 0) {
      continue;
    }
    
    // Comparar con cada descriptor almacenado
    for (const storedDescriptor of user.faceDescriptors) {
      const distance = euclideanDistance(descriptorToMatch, storedDescriptor);
      
      if (distance < threshold) {
        console.log('✅ Rostro encontrado:', user.email, 'Distancia:', distance);
        return { user, distance };
      }
    }
  }
  
  console.log('❌ Rostro no encontrado, distancia mínima superior a threshold:', threshold);
  return null;
}

// Calcular distancia euclidiana
function euclideanDistance(desc1, desc2) {
  if (desc1.length !== desc2.length) {
    throw new Error('Los descriptores deben tener la misma longitud');
  }
  
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    sum += Math.pow(desc1[i] - desc2[i], 2);
  }
  
  return Math.sqrt(sum);
}

// Limpiar toda la base de datos (solo para desarrollo)
export function clearDatabase() {
  localStorage.removeItem(DB_KEY);
  localStorage.removeItem(SESSION_KEY);
  console.log('🗑️ Base de datos limpiada');
}

// Obtener estadísticas
export function getDBStats() {
  const users = getAllUsers();
  const usersWithFace = users.filter(u => u.faceId).length;
  
  return {
    totalUsers: users.length,
    usersWithFace,
    usersWithoutFace: users.length - usersWithFace
  };
}

// Exportar/Importar datos (para backup)
export function exportDatabase() {
  return localStorage.getItem(DB_KEY);
}

export function importDatabase(data) {
  localStorage.setItem(DB_KEY, data);
  console.log('📥 Base de datos importada');
}

// Log de la base de datos (para debugging)
export function logDatabase() {
  const users = getAllUsers();
  const stats = getDBStats();
  
  console.log('📊 Estadísticas de DB:', stats);
  console.log('👥 Usuarios:', users.map(u => ({
    id: u.id,
    email: u.email,
    name: `${u.firstName} ${u.lastName}`,
    faceId: u.faceId,
    hasDescriptors: !!u.faceDescriptors,
    descriptorCount: u.faceDescriptors?.length || 0,
    descriptorLength: u.faceDescriptors?.[0]?.length || 0
  })));
}

// Función para reparar descriptores existentes
export function repairDescriptors() {
  const users = getAllUsers();
  let repaired = 0;
  
  users.forEach(user => {
    if (user.faceDescriptors && user.faceDescriptors.length > 0) {
      const original = user.faceDescriptors.length;
      user.faceDescriptors = user.faceDescriptors.map(descriptor => {
        if (descriptor instanceof Float32Array || descriptor.buffer) {
          repaired++;
          return Array.from(descriptor);
        }
        return descriptor;
      });
    }
  });
  
  if (repaired > 0) {
    localStorage.setItem(DB_KEY, JSON.stringify(users));
    console.log(`🔧 Reparados ${repaired} descriptores`);
  } else {
    console.log('✅ No hay descriptores que reparar');
  }
  
  return repaired;
}
