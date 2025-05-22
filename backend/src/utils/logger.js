const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

const logDatabaseOperation = (operation, data) => {
    console.log(
        `${colors.cyan}[Database]${colors.reset} ${colors.green}${operation}${colors.reset}`,
        data
    );
};

module.exports = { logDatabaseOperation }; 