"dmf prefix $";

function MyComponent(params: {$a: number, $b: {$c: number}}){
    return <div>
        text: {params.$a}
        c: {params.$b.$c}
    </div>
}