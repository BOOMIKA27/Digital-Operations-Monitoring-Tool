const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Log = require('../models/Log')

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE })

const sendToken = (user, statusCode, res) => {
  const token = generateToken(user._id)
  const u = user.toObject()
  delete u.password
  res.status(statusCode).json({ success: true, token, user: u })
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body
    const user = await User.create({ name, email, password, role: role || 'user' })
    await Log.create({ type: 'auth', level: 'info', source: 'Auth', message: `New user registered: ${email}`, userId: user._id })
    sendToken(user, 201, res)
  } catch (err) { next(err) }
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' })

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      await Log.create({ type: 'auth', level: 'warning', source: 'Auth', message: `Failed login attempt for: ${email}` })
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })
    await Log.create({ type: 'auth', level: 'info', source: 'Auth', message: `User logged in: ${email}`, userId: user._id })
    sendToken(user, 200, res)
  } catch (err) { next(err) }
}

exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user })
}

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body
    const user = await User.findByIdAndUpdate(req.user._id, { name, email }, { new: true, runValidators: true })
    res.json({ success: true, user })
  } catch (err) { next(err) }
}

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password incorrect' })
    }
    user.password = newPassword
    await user.save()
    res.json({ success: true, message: 'Password updated' })
  } catch (err) { next(err) }
}

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(404).json({ success: false, message: 'No user with that email' })
    // In production: send actual reset email
    res.json({ success: true, message: 'Reset link sent to email (simulated)' })
  } catch (err) { next(err) }
}
