```
class TodoListStore{
    constructor(url){
        websocket connect(url)
        websocket.on("add", (m) => this.onAdd(m));
    }
    get $list(){
        return this.$list || $bind;
    }
    get $loading(){
        return this.$loading || $bind;
    }
    add(item){
        this.$adding = true;
        let token = makeToken();
        await fetch("/add/item", {post, token, after})
        if(result)
        await websocket.once(add, (item) => item.token === token);
        this.$adding = false;
    }
    get $adding(){}
    onAdd(item){

    }
}

let todoList = new TodoListStore();

    mount(<ListRender list={$todoList}>{() => {

}}</ListRender>, document.body);

```