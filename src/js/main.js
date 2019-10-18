'use strict';

let testFunc = async () => {
	let response = await fetch('https://api.github.com/users/taruuuch');
	return response.json();
};

console.log(testFunc());
