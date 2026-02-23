// email
const isValidEmail = (email) => {
	if (!email || typeof email !== 'string') return false;
	const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return re.test(email.toLowerCase());
};

// password
const isStrongPassword = (password) => {
	if (!password || typeof password !== 'string') return false;
	return /(?=.{8,})(?=.*[A-Za-z])(?=.*\d)/.test(password);
};

// phone (optionnel, mais si fourni doit être valide)
const isValidPhone = (phone) => {
	if (!phone) return true; // optional field
	if (typeof phone !== 'string') return false;
	return /^[0-9+()\-\s]{6,20}$/.test(phone);
};

module.exports = {
	isValidEmail,
	isStrongPassword,
	isValidPhone
};
