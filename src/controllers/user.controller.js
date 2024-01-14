import {asyncHandler} from '../utils/asyncHandler.js'
import  { ApiError } from '../utils/ApiError.js'
import {User} from "../models/user.model.js"
import { updloadFileToCloud } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'



const registerUser = asyncHandler( async(req, res, next )=>{
    // res.status("200").json({
    //     message:"Successful"
    // })
    // an  algorithm for writing the register the user
    /* 1.take input from frontend 
    2. validate if the data is entered correctly  ( ! empty)
    3. check if the user is already registerd ? 
    4. check for the images , check for avatar 
    5. upload the image data to cloudinary 
    6. create the user object - create entry to db
    7. rempove password and refresh token from the respone 
    8. check  check for the user creation
    9. return the respone whatever it is */
    
    // extraction of data from the reqeuest 
    const {email, username, password, fullName} = req.body

    console.log("email is : " , email);
    console.log("username is : " , username);
    console.log("password is : " , password);

    // validating if the all inputs are not empty 
    if(
        [fullName, username, email , password].some( (field)=> field.trim() === "" )    
    ){
        throw new ApiError(401, "those fileds are can't be empty ")
    }   

    // checking if the user is already registerd 
    const userDoExist = await User.findOne({
        $or :[{email} , {username}]
    })

    if(userDoExist){
        throw new ApiError(409, "User with this username or email already exist!")
    }

    // checking for the avatar and coverimage 
     console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path;
    
    //same as for coverimage 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0]?.path;
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }
    
    // uploading to the cloudinary 
    const avatar = await updloadFileToCloud(avatarLocalPath)
    const coverImage = await updloadFileToCloud(coverImageLocalPath)

    // if avatar is faild to updload 
    if(!avatar){
        throw new ApiError(500, "Error occured while uploading avatar ")
    }

    // else all set and  craeate the user object 
    const user = await User.create({
        fullName, 
        email, 
        password, 
        avatar:avatar.url,
        coverImage:coverImage?.url || "" ,      //push if the url is found or else push empty string 
        username: username.toLowerCase()
    })

    // remove all the refresh token and password from the upfront response 
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    if(!createdUser){
        throw new ApiError(500 , "An Error occured while registering the user")
    }

    // now at the end  we are sending the final response 
    return res.status(200).json(
        // returning the api with the predeifined format of ApiResponse 
        new ApiResponse(200, createdUser, "User registered successfully !")
    )
})



export {registerUser}