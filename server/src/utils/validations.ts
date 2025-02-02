import Joi from "joi";

export const validateUser = (user: object) => {
    return Joi.object({
        username: Joi.string()
            .min(3)
            .max(20)
            .required()
            .messages({
                'string.base': 'Username must be a string.',
                'string.empty': 'Username is required.',
                'string.min': 'Username must be at least {#limit} characters long.',
                'string.max': 'Username must not exceed {#limit} characters.',
                'any.required': 'Username is required.'
            }),
        password: Joi.string()
            .pattern(/^(?=.*\d)(?=.*[a-zA-Z])/)
            .min(8)
            .max(24)
            .required()
            .messages({
                'string.base': 'Password must be a string.',
                'string.empty': 'Password is required.',
                'string.pattern.base': 'Password must contain at least one letter and one digit.',
                'string.min': 'Password must be at least {#limit} characters long.',
                'string.max': 'Password must not exceed {#limit} characters.',
                'any.required': 'Password is required.'
            })
    }).validate(user);
}