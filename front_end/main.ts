// Payload is a marshaled (but not JSON-stringified) object
// A JSON-parsed response object will be passed to the callback
const httpPost = (page_name: string, payload: any, callback: HttpPostCallback) => {
	let request = new XMLHttpRequest();
	request.onreadystatechange = () => {
		if(request.readyState === 4)
		{
			if(request.status === 200) {
				let response_obj;
				try {
					response_obj = JSON.parse(request.responseText);
				} catch(err) {}
				if (response_obj) {
					callback(response_obj);
				} else {
					callback({
						status: 'error',
						message: 'response is not valid JSON',
						response: request.responseText,
					});
				}
			} else {
				if(request.status === 0 && request.statusText.length === 0) {
					callback({
						status: 'error',
						message: 'connection failed',
					});
				} else {
					callback({
						status: 'error',
						message: `server returned status ${request.status}: ${request.statusText}`,
					});
				}
			}
		}
	};
	request.open('post', `${g_origin}/${page_name}`, true);
	request.setRequestHeader('Content-Type', 'application/json');
	console.log(payload);
	request.send(JSON.stringify(payload));
}

let mapElements: Sprite[] = [];
const thing_names = [
	"chair", // 0
	"lamp",
	"mushroom", // 2
	"outhouse",
	"pillar", // 4
	"pond",
	"rock", // 6
	"statue",
	"tree", // 8
	"turtle",
];

function onReceiveMap(ob: any) {
	// { "map": [ ["kind", x, y], ["kind", x, y], ["kind", x, y] ] }
	if ("map" in ob){
		let map = ob["map"];
		let count = Object.keys(map).length;
		for (let i = 0; i < count; i++){
			let image = ob["map"][i];
			let kind = image[0];
			let x = image[1];
			let y = image[2];

			let newImage: Sprite = new Sprite(kind, x, y, "", `${thing_names[kind]}.png`, Sprite.prototype.sit_still, Sprite.prototype.ignore_click);
			mapElements.push(newImage);
		}
	}
}

// httpPost('ajax.html', {
// 	action: 'getMap',
// }, this.onReceiveMap);

let s: string[] = [];
s.push(`<h1>Banana Quest: The Potassium Crisis</h1>`);
s.push(`<h3>In a land known as "Fruitopia," the inhabitants thrived on the delicious and nutritious fruits that grew abundantly.<br>
		One fruit, in particular, was highly treasured - the mighty banana.<br>
		Fruitopia's inhabitants had always enjoyed the health benefits and energy provided by this potassium-rich treat,
		which fueled their daily adventures and brought joy to their lives.<br><br>
		But one day, a mysterious phenomenon occurred: the banana crops across Fruitopia began to wither,
		and the supply of this essential fruit dwindled rapidly.<br>
		As the days passed, the once energetic and lively inhabitants of Fruitopia started to feel weak and fatigued.<br>
		The doctors and scientists of the land quickly identified the cause - a severe potassium deficiency was spreading among the residents,<br>
		and it threatened to plunge Fruitopia into a state of perpetual lethargy.<br>
		Desperate to restore the health and vitality of their beloved land,
		the citizens of Fruitopia are turning to you to help them find 20 bananas.<br>
		The fate of Fruitopia hangs in the balance.<br><br>
		tl;dr: Find 20 bananas to win.<br><br>
		If you are willing to undertake this noble quest, please enter your name:</h3>`);
s.push(`<input id="userInput"type="text"></input><button onclick="pushed_it();">Enter</button>`);
console.log(s);
const content = document.getElementById('content') as unknown as HTMLElement;
content.innerHTML = s.join('');

let username: string;

function pushed_it(): void {
	username = (<HTMLInputElement>document.getElementById("userInput"))!.value;
	let gameDiv: string[] = [];
	gameDiv.push(`<canvas id="myCanvas" width="1000" height="500" style="border:1px solid #cccccc;">`);
	gameDiv.push(`</canvas>`);
	content.innerHTML = gameDiv.join('');
	let game = new Game();
	let timer = setInterval(() => { game.onTimer(); }, 40);
}

interface HttpPostCallback {
	(x:any): any;
}

const random_id = (len:number) => {
    let p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[Math.floor(Math.random() * p.length)], '');
}

const g_origin = new URL(window.location.href).origin;
const g_id = random_id(12);

const center_x = 500;
const center_y = 250;
const scroll_rate = 0.03;

class Sprite {
	x: number;
	y: number;
	speed: number;
	speed_x: number = 8;
	speed_y: number = 8;
	image: HTMLImageElement;
	dest_x: number;
	dest_y: number;
	id: any;
	username: string;

	constructor(id:any, x: number, y: number, uname: string, image_url: string, update_method: { (): void; (): void; (): void; }, onclick_method: { (x: number, y: number): void; (x: number, y: number): void; (x: number, y: number): void; }) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.dest_x = x;
		this.dest_y = y;
        this.speed = 8;
		this.image = new Image();
		this.image.src = image_url;
		this.update = update_method;
		this.onclick = onclick_method;
		this.username = uname;
	}

	update(){
		this.go_toward_destination();
	}

	onclick(x: number, y: number){
		this.set_destination(x, y);
	}

	set_destination(x: number, y: number) {
		this.dest_x = x;
		this.dest_y = y;

		//Set x and y speeds using slope as ratio
		let dx: number = this.x-this.dest_x;
		let dy: number = this.y-this.dest_y;
		if (dx < 0){
			dx = dx*(-1);
		}
		if (dy < 0){
			dy = dy*(-1);
		}

		if (dx == 0){
			this.speed_x = 0;
			this.speed_y = 8;
		}
		else if(dx < dy){
			let slope: number = dy/dx;
			this.speed_x = 8 / slope;
			this.speed_y = 8;
		}
		else if(dx > dy){
			let slope: number = dy/dx;
			this.speed_x = 8;
			this.speed_y = 8 * slope;
		}
		else{
			this.speed_x = 8;
			this.speed_y = 8;
		}
	}

	ignore_click(x: number, y: number) {
	}

	move(dx: number, dy: number) {
		this.dest_x = this.x + dx;
		this.dest_y = this.y + dy;
		this.speed_x = 8;
		this.speed_y = 8;
	}

	go_toward_destination() {
		if(this.dest_x === undefined)
			return;

		if(this.x < this.dest_x)
			this.x += Math.min(this.dest_x - this.x, this.speed_x);
		else if(this.x > this.dest_x)
			this.x -= Math.min(this.x - this.dest_x, this.speed_x);
		if(this.y < this.dest_y)
			this.y += Math.min(this.dest_y - this.y, this.speed_y);
		else if(this.y > this.dest_y)
			this.y -= Math.min(this.y - this.dest_y, this.speed_y);
	}

	sit_still() {
	}
}

class Model {
	robot: Sprite;
	sprites: Sprite[];
	robot_scroll_x = 0;
	robot_scroll_y = 0;

	constructor() {
		this.sprites = [];
		this.robot = new Sprite(g_id, 50, 50, username, "blue_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.set_destination);
		id_to_sprite[g_id] = this.robot;
		this.sprites.push(this.robot);
		this.onclick(50,50);
	}

	update() {
		this.robot_scroll_x += scroll_rate * (this.robot.x - this.robot_scroll_x - center_x);
		this.robot_scroll_y += scroll_rate * (this.robot.y - this.robot_scroll_y - center_y);
		for (const sprite of this.sprites) {
			sprite.update();
		}
		for (const sprite of mapElements) {
			sprite.update();
		}
	}

	onclick(x: number, y: number) {
		for (const sprite of this.sprites) {
			sprite.onclick(x, y);
		}
	}

	move(dx: number, dy: number) {
		this.robot.move(dx, dy);
	}
}


class View
{
	model: Model;
	canvas: HTMLCanvasElement;
	map_scroll_x: number = 0;
	map_scroll_y: number = 0;
	
	constructor(model: Model) {
		this.model = model;
		this.canvas = document.getElementById("myCanvas") as HTMLCanvasElement;
	}

	update() {
		let ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
		ctx.clearRect(0, 0, 1000, 500);
		ctx.fillStyle = "#50C878";
		ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		ctx.textBaseline = 'middle';
		for (const sprite of this.model.sprites) {
			ctx.font = "20px Verdana";
			ctx.fillStyle = "#000";
			let nameOffset = ctx.measureText(sprite.username).width / 2;
			if (nameOffset > sprite.image.width) {
				nameOffset = nameOffset - (sprite.image.width / 2);
			}
			else if (nameOffset < sprite.image.width / 2) {
				nameOffset = ((sprite.image.width / 2) - nameOffset) * -1;
			}
			else {
				nameOffset = 0;
			}
			console.log(nameOffset);
			ctx.fillText(sprite.username, sprite.x - sprite.image.width / 2 - nameOffset - this.model.robot_scroll_x, sprite.y - sprite.image.height + 50 - this.model.robot_scroll_y);
			ctx.drawImage(sprite.image, sprite.x - sprite.image.width / 2 - this.model.robot_scroll_x, sprite.y - sprite.image.height / 2 - this.model.robot_scroll_y);
		}
		for (const sprite of mapElements) {
			ctx.drawImage(sprite.image, sprite.x - this.map_scroll_x, sprite.y - this.map_scroll_y);
			console.log(sprite.username);
		}
	}
}

const id_to_sprite: Record<string, Sprite> = {};

class Controller
{
	model: Model;
	view: View;
	key_right: boolean;
	key_left: boolean;
	key_up: boolean;
	key_down: boolean;
	last_updates_request_time: number;
	map_scroll_speed = 10;
	
	constructor(model: Model, view: View) {
		this.model = model;
		this.view = view;
		this.key_right = false;
		this.key_left = false;
		this.key_up = false;
		this.key_down = false;
		let self = this;
		this.last_updates_request_time = Date.now();
		view.canvas.addEventListener("click", function(event) { self.onClick(event); });
		document.addEventListener('keydown', function(event) { self.keyDown(event); }, false);
		document.addEventListener('keyup', function(event) { self.keyUp(event); }, false);
	}

	onClick(event: MouseEvent) {
		const x = event.pageX - this.view.canvas.offsetLeft;
		const y = event.pageY - this.view.canvas.offsetTop;
		this.model.onclick(x, y);

		httpPost('ajax.html', {
			id: g_id,
			action: 'click',
			x: x,
			y: y,
			username: this.model.robot.username
		}, this.onAcknowledgeClick);
	}

	keyDown(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = true;
		else if(event.keyCode == 37) this.key_left = true;
		else if(event.keyCode == 38) this.key_up = true;
		else if(event.keyCode == 40) this.key_down = true;
	}

	keyUp(event: KeyboardEvent) {
		if(event.keyCode == 39) this.key_right = false;
		else if(event.keyCode == 37) this.key_left = false;
		else if(event.keyCode == 38) this.key_up = false;
		else if(event.keyCode == 40) this.key_down = false;
	}

	onAcknowledgeClick(ob: any) {
		console.log(`Response to click: ${JSON.stringify(ob)}`);
	}

	onReceiveUpdates(ob: any) {
		// { "updates": [ ["id", 3112, 2131, "uname"], ["id", 123, 321, "uname"], ["id", 234, 654, "uname"] ] }
		console.log(`ob = ${JSON.stringify(ob)}`);
		if ("updates" in ob){
			let updates = ob["updates"];
			let count = Object.keys(updates).length;
			for (let i = 0; i < count; i++){
				let update = ob["updates"][i];
				let id = update[0];
				let x = update[1];
				let y = update[2];
				let uname = update[3];

				// find the sprite with id == id
				for (let j = 0; j < this.model.sprites.length; j++){
					if (id in id_to_sprite){
						const sprite1 = id_to_sprite[id];
						sprite1.set_destination(x, y);
						return;
					}
					else{
						let newPlayer:Sprite = new Sprite(id, x, y, uname, "green_robot.png", Sprite.prototype.go_toward_destination, Sprite.prototype.ignore_click);
						this.model.sprites.push(newPlayer);
						id_to_sprite[id] = newPlayer;
						return;
					}
				}
			}
		}
	}

	update() {
		let dx = 0;
		let dy = 0;
        let speed = this.model.robot.speed;
		if(this.key_right) {
			dx += speed;
			this.view.map_scroll_x += this.map_scroll_speed;
		}
		if(this.key_left) { 
			dx -= speed;
			this.view.map_scroll_x -= this.map_scroll_speed;
		}
		if(this.key_up) {
			dy -= speed;
			this.view.map_scroll_y -= this.map_scroll_speed;
		}
		if(this.key_down) {
			dy += speed;
			this.view.map_scroll_y += this.map_scroll_speed;
		}
		if(dx != 0 || dy != 0)
			this.model.move(dx, dy);


		const time = Date.now();
		if (time - this.last_updates_request_time >= 1000) {
			this.last_updates_request_time = time;
			httpPost('ajax.html', {
				id: g_id,
				action: 'getUpdates',
				x: this.model.robot.x,
				y: this.model.robot.y,
				uname: this.model.robot.username
			}, (ob) => { return this.onReceiveUpdates(ob); });
			// console.log(this.model.sprites)
		}
	}
}


class Game {
	model: Model;
	view: View;
	controller: Controller;
	
	constructor() {
		this.model = new Model();
		this.view = new View(this.model);
		this.controller = new Controller(this.model, this.view);
		mapElements.push(new Sprite("chair", 100, 100, "", "green_robot.png", Sprite.prototype.sit_still, Sprite.prototype.ignore_click));
	}

	onTimer() {
		this.controller.update();
		this.model.update();
		this.view.update();
	}
}