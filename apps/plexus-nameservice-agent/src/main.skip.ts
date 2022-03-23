import axios from "axios";

describe("Dice Binding Benchmark", function () {

    test("roundtrip to the container nameservice", () => {
        
        axios.put("localhost:3030/my-plexus-service/id/1234-5678-0")
        
        .then (res => {

            console.log(`statusCode: ${res.status}`);

            console.log(res);
        })

        .catch(err=>{
            console.error(err);
        })

        .then (() => {

            axios.get("localhost:3030/my-plexus-service")
           
            .then(res => {
 
             console.log(`statusCode: ${res.status}`);
 
             console.log(res);
             
            })
            
            .catch(err=>{
                console.error(err);
            });
        });
    });
});