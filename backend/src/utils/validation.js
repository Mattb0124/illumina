const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters',
        'any.required': 'Name is required'
      }),
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'Password is required'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    email: Joi.string()
      .email()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    name: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 100 characters'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
      .required()
      .messages({
        'string.min': 'New password must be at least 8 characters long',
        'string.max': 'New password cannot exceed 128 characters',
        'string.pattern.base': 'New password must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
        'any.required': 'New password is required'
      })
  }),

  deleteAccount: Joi.object({
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required to delete account'
      })
  })
};

// Study validation schemas
const studySchemas = {
  enrollStudy: Joi.object({
    studyId: Joi.string()
      .required()
      .messages({
        'any.required': 'Study ID is required'
      })
  }),

  updateProgress: Joi.object({
    dayNumber: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'Day number must be a number',
        'number.integer': 'Day number must be an integer',
        'number.min': 'Day number must be at least 1',
        'any.required': 'Day number is required'
      }),
    weekNumber: Joi.number()
      .integer()
      .min(1)
      .messages({
        'number.base': 'Week number must be a number',
        'number.integer': 'Week number must be an integer',
        'number.min': 'Week number must be at least 1'
      }),
    completed: Joi.boolean()
      .messages({
        'boolean.base': 'Completed must be true or false'
      }),
    notes: Joi.string()
      .max(10000)
      .allow('')
      .messages({
        'string.max': 'Notes cannot exceed 10000 characters'
      }),
    reflectionAnswers: Joi.object()
      .messages({
        'object.base': 'Reflection answers must be an object'
      })
  })
};

// Query parameter validation
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      })
  }),

  studyFilters: Joi.object({
    difficulty: Joi.string()
      .valid('beginner', 'intermediate', 'advanced')
      .messages({
        'any.only': 'Difficulty must be beginner, intermediate, or advanced'
      }),
    audience: Joi.string()
      .valid('individual', 'couples', 'group', 'family')
      .messages({
        'any.only': 'Audience must be individual, couples, group, or family'
      }),
    studyStyle: Joi.string()
      .valid('devotional', 'topical', 'book-study', 'couples', 'marriage')
      .messages({
        'any.only': 'Study style must be devotional, topical, book-study, couples, or marriage'
      }),
    tags: Joi.array()
      .items(Joi.string())
      .messages({
        'array.base': 'Tags must be an array of strings'
      })
  })
};

/**
 * Validation middleware factory
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'query' ? req.query :
                  source === 'params' ? req.params :
                  req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors
      });
    }

    // Replace the original data with validated/sanitized data
    if (source === 'query') {
      req.query = value;
    } else if (source === 'params') {
      req.params = value;
    } else {
      req.body = value;
    }

    next();
  };
};

module.exports = {
  userSchemas,
  studySchemas,
  querySchemas,
  validate
};